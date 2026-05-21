from fastapi import APIRouter, Depends
from routers.auth import verify_token
from config import get_supabase
from collections import defaultdict
import uuid
from datetime import datetime, date, timedelta

router = APIRouter()

@router.get("/signals")
async def fraud_signals(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    signals = db.table("fraud_signals").select("*,branches(name),loans(loan_number)").order("created_at", desc=True).limit(50).execute()
    return signals.data

@router.get("/scan")
async def scan_for_fraud(token_data: dict = Depends(verify_token)):
    """AI-powered fraud signal detection across portfolio"""
    db = get_supabase()
    loans = db.table("loans").select("*").execute().data
    payments = db.table("payments").select("*").execute().data
    clients = db.table("clients").select("id,client_code,full_name,branch_id").execute().data
    branches = db.table("branches").select("id,name").execute().data
    
    branch_map = {b["id"]: b["name"] for b in branches}
    client_map = {c["id"]: c for c in clients}
    
    signals = []
    
    # 1. Month-end disbursement spikes
    disbursements_by_day = defaultdict(list)
    for l in loans:
        if l.get("disbursement_date"):
            disbursements_by_day[l["disbursement_date"]].append(l)
    
    for day, day_loans in disbursements_by_day.items():
        try:
            d = datetime.strptime(day, "%Y-%m-%d")
            if d.day >= 28:  # Month-end
                if len(day_loans) > 5:
                    branch_ids = list(set(l.get("branch_id") for l in day_loans if l.get("branch_id")))
                    for bid in branch_ids:
                        b_loans = [l for l in day_loans if l.get("branch_id") == bid]
                        if len(b_loans) >= 3:
                            signals.append({
                                "signal_type": "month_end_disbursement_spike",
                                "severity": "high",
                                "description": f"Unusual {len(b_loans)} disbursements on {day} (month-end) at {branch_map.get(bid, 'Unknown')}",
                                "branch_id": bid,
                                "branch_name": branch_map.get(bid, "Unknown"),
                                "details": {"date": day, "count": len(b_loans), "total_amount": sum(float(l.get("principal_amount",0)) for l in b_loans)},
                            })
        except:
            pass
    
    # 2. Multiple loans per client (potential ghost clients / over-borrowing)
    client_loans = defaultdict(list)
    for l in loans:
        if l.get("client_id") and l.get("status") == "active":
            client_loans[l["client_id"]].append(l)
    
    for cid, cloans in client_loans.items():
        if len(cloans) >= 3:
            client = client_map.get(cid, {})
            total_exposure = sum(float(l.get("outstanding_balance", 0)) for l in cloans)
            signals.append({
                "signal_type": "multiple_active_loans",
                "severity": "critical" if len(cloans) >= 4 else "high",
                "description": f"Client {client.get('full_name','Unknown')} ({client.get('client_code','')}) has {len(cloans)} active loans totaling {total_exposure:,.0f} RWF",
                "client_id": cid,
                "client_name": client.get("full_name"),
                "branch_id": client.get("branch_id"),
                "branch_name": branch_map.get(client.get("branch_id",""), "Unknown"),
                "details": {"loan_count": len(cloans), "total_exposure": total_exposure},
            })
    
    # 3. High restructuring rate by loan officer
    lo_data = defaultdict(lambda: {"total": 0, "restructured": 0, "branch_id": None})
    for l in loans:
        lo = l.get("loan_officer") or "Unknown"
        lo_data[lo]["total"] += 1
        if l.get("restructured"):
            lo_data[lo]["restructured"] += 1
        lo_data[lo]["branch_id"] = l.get("branch_id")
    
    for lo, data in lo_data.items():
        if data["total"] > 10:
            rate = data["restructured"] / data["total"] * 100
            if rate > 20:
                signals.append({
                    "signal_type": "high_restructuring_rate",
                    "severity": "critical" if rate > 35 else "high",
                    "description": f"Loan officer {lo} has {rate:.1f}% restructuring rate ({data['restructured']}/{data['total']} loans)",
                    "loan_officer": lo,
                    "branch_id": data["branch_id"],
                    "branch_name": branch_map.get(data["branch_id"] or "", "Unknown"),
                    "details": {"restructured": data["restructured"], "total": data["total"], "rate": round(rate, 2)},
                })
    
    # 4. Payment clustering around reporting dates
    payment_days = defaultdict(int)
    for p in payments:
        if p.get("payment_date"):
            try:
                d = datetime.strptime(p["payment_date"], "%Y-%m-%d").day
                payment_days[d] += 1
            except:
                pass
    
    total_payments = len(payments)
    if total_payments > 0:
        for day, count in payment_days.items():
            if day in [1, 2, 28, 29, 30, 31]:
                pct = count / total_payments * 100
                if pct > 15:
                    signals.append({
                        "signal_type": "payment_date_clustering",
                        "severity": "medium",
                        "description": f"{pct:.1f}% of all payments occur on day {day} of month — potential artificial repayment pattern",
                        "details": {"day": day, "count": count, "percentage": round(pct, 2)},
                    })
    
    # 5. Very high PAR loans still classified as active (potential misclassification)
    misclassified = [l for l in loans if (l.get("par_days") or 0) > 180 and l.get("status") == "active"]
    if misclassified:
        signals.append({
            "signal_type": "possible_misclassification",
            "severity": "high",
            "description": f"{len(misclassified)} loans have PAR > 180 days but are still classified as 'active' — possible NPL masking",
            "details": {"count": len(misclassified), "amount": sum(float(l.get("outstanding_balance",0)) for l in misclassified)},
        })
    
    return {
        "scan_date": datetime.utcnow().isoformat(),
        "total_signals": len(signals),
        "critical": sum(1 for s in signals if s.get("severity") == "critical"),
        "high": sum(1 for s in signals if s.get("severity") == "high"),
        "medium": sum(1 for s in signals if s.get("severity") == "medium"),
        "signals": signals,
    }

@router.get("/summary")
async def fraud_summary(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    signals = db.table("fraud_signals").select("severity,signal_type,is_investigated").execute().data
    return {
        "total": len(signals),
        "critical": sum(1 for s in signals if s.get("severity") == "critical"),
        "high": sum(1 for s in signals if s.get("severity") == "high"),
        "uninvestigated": sum(1 for s in signals if not s.get("is_investigated")),
    }
