"""
Import router — CSV / Excel upload + manual entry for:
  • clients
  • loans
  • payments
  • portfolio_snapshots
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from routers.auth import verify_token
from config import get_supabase
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import io
import uuid
from datetime import datetime, date

router = APIRouter()

# ─── helpers ─────────────────────────────────────────────────────────────────

def _safe_float(v):
    try:
        return float(v) if v not in (None, "", "nan", "NaN") else None
    except Exception:
        return None

def _safe_int(v):
    try:
        return int(float(v)) if v not in (None, "", "nan", "NaN") else None
    except Exception:
        return None

def _safe_date(v):
    if v in (None, "", "nan", "NaN", "NaT"):
        return None
    try:
        if isinstance(v, (date, datetime)):
            return str(v)[:10]
        return str(pd.to_datetime(v).date())
    except Exception:
        return None

def _safe_bool(v):
    if isinstance(v, bool):
        return v
    if str(v).lower() in ("true", "1", "yes"):
        return True
    return False

def _parse_upload(file: UploadFile) -> pd.DataFrame:
    content = file.file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        elif name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content), dtype=str)
        else:
            # Try CSV first, then Excel
            try:
                df = pd.read_csv(io.BytesIO(content), dtype=str)
            except Exception:
                df = pd.read_excel(io.BytesIO(content), dtype=str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot parse file: {e}")
    # Strip whitespace from column names and string values
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
    return df

# ─── GET: template info & column reference ───────────────────────────────────

@router.get("/templates")
async def get_templates(token_data: dict = Depends(verify_token)):
    """Return column reference for each importable entity."""
    return {
        "clients": {
            "required": ["full_name", "client_code"],
            "optional": ["national_id", "phone", "email", "gender", "date_of_birth",
                         "province", "district", "sector", "branch_id", "client_segment",
                         "business_type", "registration_date", "risk_score", "risk_category"],
            "notes": "risk_category: low | medium | high | critical",
        },
        "loans": {
            "required": ["loan_number", "principal_amount"],
            "optional": ["client_id", "client_code", "branch_id", "loan_officer",
                         "disbursement_date", "maturity_date", "outstanding_balance",
                         "interest_rate", "term_months", "status", "par_days",
                         "days_past_due", "restructured", "sector", "write_off_amount"],
            "notes": "status: active | npl | written_off | closed. Use client_code to auto-resolve client_id.",
        },
        "payments": {
            "required": ["payment_date", "amount_paid"],
            "optional": ["loan_id", "loan_number", "client_id", "client_code",
                         "branch_id", "scheduled_date", "amount_due", "principal_paid",
                         "interest_paid", "penalty_paid", "payment_method", "is_late",
                         "days_late", "reference", "recorded_by"],
            "notes": "Use loan_number to auto-resolve loan_id.",
        },
        "portfolio_snapshots": {
            "required": ["snapshot_date"],
            "optional": ["branch_id", "sector", "gross_loan_portfolio", "active_loans",
                         "active_clients", "disbursements", "par_30", "par_60", "par_90",
                         "npl_ratio", "write_offs", "restructured_loans_pct",
                         "repeat_borrower_rate", "avg_loan_size", "collection_rate"],
            "notes": "Leave branch_id blank for institution-wide snapshots.",
        },
    }

# ─── POST: CSV/Excel upload ──────────────────────────────────────────────────

@router.post("/csv/{entity}")
async def import_csv(
    entity: str,
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token),
):
    """
    Upload CSV or Excel file for bulk import.
    entity: clients | loans | payments | portfolio_snapshots
    """
    if entity not in ("clients", "loans", "payments", "portfolio_snapshots"):
        raise HTTPException(status_code=400, detail=f"Unknown entity: {entity}")

    df = _parse_upload(file)
    if df.empty:
        raise HTTPException(status_code=400, detail="File is empty")

    db = get_supabase()
    rows_ok, rows_err, errors = [], [], []

    if entity == "clients":
        rows_ok, errors = _build_clients(df, db)
    elif entity == "loans":
        rows_ok, errors = _build_loans(df, db)
    elif entity == "payments":
        rows_ok, errors = _build_payments(df, db)
    elif entity == "portfolio_snapshots":
        rows_ok, errors = _build_snapshots(df, db)

    inserted = 0
    if rows_ok:
        try:
            result = db.table(entity).upsert(rows_ok).execute()
            inserted = len(rows_ok)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DB insert failed: {e}")

    # After importing loans or clients, trigger auto-alert generation
    if entity in ("loans", "clients") and inserted:
        _generate_alerts(db)

    return {
        "entity": entity,
        "total_rows": len(df),
        "inserted": inserted,
        "skipped": len(errors),
        "errors": errors[:20],  # cap error list
    }

# ─── POST: manual single-record entry ────────────────────────────────────────

class ClientIn(BaseModel):
    full_name: str
    client_code: str
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    sector: Optional[str] = None
    branch_id: Optional[str] = None
    client_segment: Optional[str] = None
    business_type: Optional[str] = None
    registration_date: Optional[str] = None
    risk_score: Optional[float] = 50.0
    risk_category: Optional[str] = "medium"

class LoanIn(BaseModel):
    loan_number: str
    principal_amount: float
    client_id: Optional[str] = None
    client_code: Optional[str] = None
    branch_id: Optional[str] = None
    loan_officer: Optional[str] = None
    disbursement_date: Optional[str] = None
    maturity_date: Optional[str] = None
    outstanding_balance: Optional[float] = None
    interest_rate: Optional[float] = None
    term_months: Optional[int] = None
    status: Optional[str] = "active"
    par_days: Optional[int] = 0
    days_past_due: Optional[int] = 0
    restructured: Optional[bool] = False
    sector: Optional[str] = None
    write_off_amount: Optional[float] = 0.0
    product_id: Optional[str] = None

class PaymentIn(BaseModel):
    payment_date: str
    amount_paid: float
    loan_id: Optional[str] = None
    loan_number: Optional[str] = None
    client_id: Optional[str] = None
    client_code: Optional[str] = None
    branch_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    amount_due: Optional[float] = None
    principal_paid: Optional[float] = None
    interest_paid: Optional[float] = None
    penalty_paid: Optional[float] = 0.0
    payment_method: Optional[str] = "cash"
    is_late: Optional[bool] = False
    days_late: Optional[int] = 0
    reference: Optional[str] = None
    recorded_by: Optional[str] = None

class SnapshotIn(BaseModel):
    snapshot_date: str
    branch_id: Optional[str] = None
    sector: Optional[str] = None
    gross_loan_portfolio: Optional[float] = None
    active_loans: Optional[int] = None
    active_clients: Optional[int] = None
    disbursements: Optional[float] = None
    par_30: Optional[float] = None
    par_60: Optional[float] = None
    par_90: Optional[float] = None
    npl_ratio: Optional[float] = None
    write_offs: Optional[float] = None
    restructured_loans_pct: Optional[float] = None
    repeat_borrower_rate: Optional[float] = None
    avg_loan_size: Optional[float] = None
    collection_rate: Optional[float] = None

@router.post("/manual/client")
async def manual_client(body: ClientIn, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    rec = body.dict(exclude_none=False)
    # Resolve branch by name if needed (already UUID or None)
    rec["id"] = str(uuid.uuid4())
    rec["created_at"] = datetime.utcnow().isoformat()
    rec["updated_at"] = datetime.utcnow().isoformat()
    rec["is_active"] = True
    _clean_nulls(rec)
    try:
        result = db.table("clients").upsert(rec, on_conflict="client_code").execute()
        _generate_alerts(db)
        return {"success": True, "id": rec["id"], "data": result.data[0] if result.data else rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual/loan")
async def manual_loan(body: LoanIn, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    rec = body.dict(exclude_none=False)
    # Resolve client_id from client_code
    if not rec.get("client_id") and rec.get("client_code"):
        r = db.table("clients").select("id").eq("client_code", rec["client_code"]).execute()
        if r.data:
            rec["client_id"] = r.data[0]["id"]
    rec.pop("client_code", None)
    if rec.get("outstanding_balance") is None:
        rec["outstanding_balance"] = rec["principal_amount"]
    rec["id"] = str(uuid.uuid4())
    rec["created_at"] = datetime.utcnow().isoformat()
    rec["updated_at"] = datetime.utcnow().isoformat()
    _clean_nulls(rec)
    try:
        result = db.table("loans").upsert(rec, on_conflict="loan_number").execute()
        _generate_alerts(db)
        return {"success": True, "id": rec["id"], "data": result.data[0] if result.data else rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual/payment")
async def manual_payment(body: PaymentIn, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    rec = body.dict(exclude_none=False)
    # Resolve loan_id from loan_number
    if not rec.get("loan_id") and rec.get("loan_number"):
        r = db.table("loans").select("id,client_id,branch_id").eq("loan_number", rec["loan_number"]).execute()
        if r.data:
            rec["loan_id"] = r.data[0]["id"]
            if not rec.get("client_id"):
                rec["client_id"] = r.data[0].get("client_id")
            if not rec.get("branch_id"):
                rec["branch_id"] = r.data[0].get("branch_id")
    # Resolve client_id from client_code
    if not rec.get("client_id") and rec.get("client_code"):
        r = db.table("clients").select("id").eq("client_code", rec["client_code"]).execute()
        if r.data:
            rec["client_id"] = r.data[0]["id"]
    rec.pop("loan_number", None)
    rec.pop("client_code", None)
    rec["id"] = str(uuid.uuid4())
    rec["created_at"] = datetime.utcnow().isoformat()
    _clean_nulls(rec)
    try:
        result = db.table("payments").insert(rec).execute()
        return {"success": True, "id": rec["id"], "data": result.data[0] if result.data else rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual/snapshot")
async def manual_snapshot(body: SnapshotIn, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    rec = body.dict(exclude_none=False)
    rec["id"] = str(uuid.uuid4())
    rec["created_at"] = datetime.utcnow().isoformat()
    _clean_nulls(rec)
    try:
        result = db.table("portfolio_snapshots").insert(rec).execute()
        return {"success": True, "id": rec["id"], "data": result.data[0] if result.data else rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── GET: import history (last 50 entries from audit log) ────────────────────

@router.get("/history")
async def import_history(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    try:
        result = db.table("audit_logs").select("*").eq("action", "import").order("created_at", desc=True).limit(50).execute()
        return result.data
    except Exception:
        return []

# ─── Internal builders ────────────────────────────────────────────────────────

def _clean_nulls(d: dict):
    """Remove keys with None values to avoid Supabase type errors."""
    keys = [k for k, v in list(d.items()) if v is None]
    for k in keys:
        del d[k]

def _resolve_clients(db, df) -> dict:
    """Return {client_code: client_id} map."""
    codes = [v for v in df.get("client_code", pd.Series()).dropna().unique() if v]
    if not codes:
        return {}
    r = db.table("clients").select("id,client_code").in_("client_code", list(codes)).execute()
    return {row["client_code"]: row["id"] for row in (r.data or [])}

def _resolve_loans(db, df) -> dict:
    """Return {loan_number: loan_id} map."""
    nums = [v for v in df.get("loan_number", pd.Series()).dropna().unique() if v]
    if not nums:
        return {}
    r = db.table("loans").select("id,loan_number,client_id,branch_id").in_("loan_number", list(nums)).execute()
    return {row["loan_number"]: row for row in (r.data or [])}

def _build_clients(df: pd.DataFrame, db) -> tuple:
    rows, errors = [], []
    for i, row in df.iterrows():
        full_name = str(row.get("full_name", "") or "").strip()
        client_code = str(row.get("client_code", "") or "").strip()
        if not full_name or not client_code:
            errors.append({"row": i + 2, "reason": "Missing full_name or client_code"})
            continue
        rec = {
            "id": str(uuid.uuid4()),
            "full_name": full_name,
            "client_code": client_code,
            "national_id": row.get("national_id") or None,
            "phone": row.get("phone") or None,
            "email": row.get("email") or None,
            "gender": row.get("gender") or None,
            "date_of_birth": _safe_date(row.get("date_of_birth")),
            "province": row.get("province") or None,
            "district": row.get("district") or None,
            "sector": row.get("sector") or None,
            "branch_id": row.get("branch_id") or None,
            "client_segment": row.get("client_segment") or None,
            "business_type": row.get("business_type") or None,
            "registration_date": _safe_date(row.get("registration_date")),
            "risk_score": _safe_float(row.get("risk_score")) or 50.0,
            "risk_category": row.get("risk_category") or "medium",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        _clean_nulls(rec)
        rows.append(rec)
    return rows, errors

def _build_loans(df: pd.DataFrame, db) -> tuple:
    rows, errors = [], []
    client_map = _resolve_clients(db, df)
    for i, row in df.iterrows():
        loan_number = str(row.get("loan_number", "") or "").strip()
        principal = _safe_float(row.get("principal_amount"))
        if not loan_number or principal is None:
            errors.append({"row": i + 2, "reason": "Missing loan_number or principal_amount"})
            continue
        client_id = row.get("client_id") or client_map.get(str(row.get("client_code", "") or "").strip())
        rec = {
            "id": str(uuid.uuid4()),
            "loan_number": loan_number,
            "client_id": client_id or None,
            "branch_id": row.get("branch_id") or None,
            "loan_officer": row.get("loan_officer") or None,
            "disbursement_date": _safe_date(row.get("disbursement_date")),
            "maturity_date": _safe_date(row.get("maturity_date")),
            "principal_amount": principal,
            "outstanding_balance": _safe_float(row.get("outstanding_balance")) or principal,
            "interest_rate": _safe_float(row.get("interest_rate")),
            "term_months": _safe_int(row.get("term_months")),
            "status": row.get("status") or "active",
            "par_days": _safe_int(row.get("par_days")) or 0,
            "days_past_due": _safe_int(row.get("days_past_due")) or 0,
            "restructured": _safe_bool(row.get("restructured")),
            "restructure_count": _safe_int(row.get("restructure_count")) or 0,
            "write_off_amount": _safe_float(row.get("write_off_amount")) or 0.0,
            "sector": row.get("sector") or None,
            "product_id": row.get("product_id") or None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        _clean_nulls(rec)
        rows.append(rec)
    return rows, errors

def _build_payments(df: pd.DataFrame, db) -> tuple:
    rows, errors = [], []
    client_map = _resolve_clients(db, df)
    loan_map = _resolve_loans(db, df)
    for i, row in df.iterrows():
        payment_date = _safe_date(row.get("payment_date"))
        amount_paid = _safe_float(row.get("amount_paid"))
        if not payment_date or amount_paid is None:
            errors.append({"row": i + 2, "reason": "Missing payment_date or amount_paid"})
            continue
        # Resolve loan
        loan_number = str(row.get("loan_number", "") or "").strip()
        loan_rec = loan_map.get(loan_number, {})
        loan_id = row.get("loan_id") or (loan_rec.get("id") if loan_rec else None)
        client_id = row.get("client_id") or client_map.get(str(row.get("client_code","") or "").strip()) or (loan_rec.get("client_id") if loan_rec else None)
        branch_id = row.get("branch_id") or (loan_rec.get("branch_id") if loan_rec else None)
        rec = {
            "id": str(uuid.uuid4()),
            "loan_id": loan_id or None,
            "client_id": client_id or None,
            "branch_id": branch_id or None,
            "payment_date": payment_date,
            "scheduled_date": _safe_date(row.get("scheduled_date")),
            "amount_due": _safe_float(row.get("amount_due")),
            "amount_paid": amount_paid,
            "principal_paid": _safe_float(row.get("principal_paid")),
            "interest_paid": _safe_float(row.get("interest_paid")),
            "penalty_paid": _safe_float(row.get("penalty_paid")) or 0.0,
            "payment_method": row.get("payment_method") or "cash",
            "is_late": _safe_bool(row.get("is_late")),
            "days_late": _safe_int(row.get("days_late")) or 0,
            "reference": row.get("reference") or None,
            "recorded_by": row.get("recorded_by") or None,
            "created_at": datetime.utcnow().isoformat(),
        }
        _clean_nulls(rec)
        rows.append(rec)
    return rows, errors

def _build_snapshots(df: pd.DataFrame, db) -> tuple:
    rows, errors = [], []
    for i, row in df.iterrows():
        snapshot_date = _safe_date(row.get("snapshot_date"))
        if not snapshot_date:
            errors.append({"row": i + 2, "reason": "Missing snapshot_date"})
            continue
        rec = {
            "id": str(uuid.uuid4()),
            "snapshot_date": snapshot_date,
            "branch_id": row.get("branch_id") or None,
            "sector": row.get("sector") or None,
            "gross_loan_portfolio": _safe_float(row.get("gross_loan_portfolio")),
            "active_loans": _safe_int(row.get("active_loans")),
            "active_clients": _safe_int(row.get("active_clients")),
            "disbursements": _safe_float(row.get("disbursements")),
            "par_30": _safe_float(row.get("par_30")),
            "par_60": _safe_float(row.get("par_60")),
            "par_90": _safe_float(row.get("par_90")),
            "npl_ratio": _safe_float(row.get("npl_ratio")),
            "write_offs": _safe_float(row.get("write_offs")),
            "restructured_loans_pct": _safe_float(row.get("restructured_loans_pct")),
            "repeat_borrower_rate": _safe_float(row.get("repeat_borrower_rate")),
            "avg_loan_size": _safe_float(row.get("avg_loan_size")),
            "collection_rate": _safe_float(row.get("collection_rate")),
            "created_at": datetime.utcnow().isoformat(),
        }
        _clean_nulls(rec)
        rows.append(rec)
    return rows, errors

# ─── Auto alert generation after import ──────────────────────────────────────

def _generate_alerts(db):
    """Generate risk alerts based on current loan data after an import."""
    try:
        loans = db.table("loans").select("id,branch_id,client_id,par_days,outstanding_balance,status,restructured").execute().data
        if not loans:
            return
        total = len(loans)
        par30 = [l for l in loans if (l.get("par_days") or 0) > 30]
        par30_rate = len(par30) / total * 100 if total else 0

        alerts_to_create = []

        # Institution-wide PAR breach
        if par30_rate > 8:
            alerts_to_create.append({
                "id": str(uuid.uuid4()),
                "alert_type": "par_threshold_breach",
                "severity": "critical" if par30_rate > 12 else "high",
                "title": f"PAR>30 at {par30_rate:.1f}% — exceeds threshold",
                "description": f"Portfolio-at-risk above 30 days has reached {par30_rate:.1f}% ({len(par30)} loans). Immediate review required.",
                "is_resolved": False,
                "created_at": datetime.utcnow().isoformat(),
            })

        # Restructured loans concentration
        restructured = [l for l in loans if l.get("restructured")]
        if restructured:
            r_rate = len(restructured) / total * 100
            if r_rate > 8:
                alerts_to_create.append({
                    "id": str(uuid.uuid4()),
                    "alert_type": "restructuring_concentration",
                    "severity": "high" if r_rate > 10 else "medium",
                    "title": f"Restructured loans at {r_rate:.1f}%",
                    "description": f"{len(restructured)} loans ({r_rate:.1f}%) have been restructured, indicating potential evergreening risk.",
                    "is_resolved": False,
                    "created_at": datetime.utcnow().isoformat(),
                })

        # Per-branch PAR alerts
        from collections import defaultdict
        branch_par = defaultdict(lambda: {"total": 0, "par30": 0, "id": None})
        for l in loans:
            bid = l.get("branch_id")
            if bid:
                branch_par[bid]["total"] += 1
                branch_par[bid]["id"] = bid
                if (l.get("par_days") or 0) > 30:
                    branch_par[bid]["par30"] += 1
        for bid, data in branch_par.items():
            if data["total"] > 0:
                bpar = data["par30"] / data["total"] * 100
                if bpar > 12:
                    alerts_to_create.append({
                        "id": str(uuid.uuid4()),
                        "alert_type": "branch_par_breach",
                        "severity": "critical" if bpar > 15 else "high",
                        "title": f"Branch PAR>30 critical: {bpar:.1f}%",
                        "description": f"Branch has {data['par30']} loans past 30 days ({bpar:.1f}% PAR rate).",
                        "branch_id": bid,
                        "is_resolved": False,
                        "created_at": datetime.utcnow().isoformat(),
                    })

        if alerts_to_create:
            db.table("risk_alerts").insert(alerts_to_create).execute()
    except Exception:
        pass  # Never let alert generation break imports