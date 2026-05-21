from fastapi import APIRouter, Depends
from routers.auth import verify_token
from config import get_supabase
from collections import defaultdict

router = APIRouter()

@router.get("/risk-heatmap")
async def risk_heatmap(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("branch_id,sector,par_days,outstanding_balance,status").execute().data
    branches = db.table("branches").select("id,name,province").execute().data
    
    heatmap = defaultdict(lambda: defaultdict(lambda: {"count": 0, "amount": 0, "par_count": 0}))
    for l in loans:
        bid = l.get("branch_id")
        sector = l.get("sector") or "other"
        amount = float(l.get("outstanding_balance") or 0)
        if bid:
            heatmap[bid][sector]["count"] += 1
            heatmap[bid][sector]["amount"] += amount
            if (l.get("par_days") or 0) > 30:
                heatmap[bid][sector]["par_count"] += 1
    
    branch_map = {b["id"]: b for b in branches}
    result = []
    for bid, sectors in heatmap.items():
        branch = branch_map.get(bid, {})
        for sector, data in sectors.items():
            par_rate = data["par_count"] / data["count"] * 100 if data["count"] else 0
            result.append({
                "branch": branch.get("name", bid),
                "province": branch.get("province", ""),
                "sector": sector,
                "loan_count": data["count"],
                "amount": data["amount"],
                "par_rate": round(par_rate, 2),
                "risk_level": "critical" if par_rate > 15 else "high" if par_rate > 10 else "medium" if par_rate > 5 else "low",
            })
    return sorted(result, key=lambda x: x["par_rate"], reverse=True)

@router.get("/loan-officer-performance")
async def loan_officer_performance(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("loan_officer,branch_id,par_days,outstanding_balance,status,principal_amount").execute().data
    branches = db.table("branches").select("id,name").execute().data
    branch_map = {b["id"]: b["name"] for b in branches}
    
    officers = defaultdict(lambda: {"total": 0, "par30": 0, "portfolio": 0.0, "disbursed": 0.0, "npl": 0, "branch_id": None})
    for l in loans:
        lo = l.get("loan_officer") or "Unknown"
        officers[lo]["total"] += 1
        officers[lo]["portfolio"] += float(l.get("outstanding_balance") or 0)
        officers[lo]["disbursed"] += float(l.get("principal_amount") or 0)
        officers[lo]["branch_id"] = l.get("branch_id")
        if (l.get("par_days") or 0) > 30:
            officers[lo]["par30"] += 1
        if l.get("status") in ["npl", "written_off"]:
            officers[lo]["npl"] += 1
    
    result = []
    for lo, data in officers.items():
        par_rate = data["par30"] / data["total"] * 100 if data["total"] else 0
        result.append({
            "loan_officer": lo,
            "branch": branch_map.get(data["branch_id"], "Unknown"),
            "total_loans": data["total"],
            "par_30_count": data["par30"],
            "par_30_rate": round(par_rate, 2),
            "npl_count": data["npl"],
            "portfolio_value": data["portfolio"],
            "performance": "excellent" if par_rate < 3 else "good" if par_rate < 6 else "warning" if par_rate < 10 else "poor",
        })
    return sorted(result, key=lambda x: x["par_30_rate"], reverse=True)

@router.get("/repayment-patterns")
async def repayment_patterns(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    payments = db.table("payments").select("payment_date,amount_due,amount_paid,is_late,days_late,payment_method").order("payment_date", desc=True).limit(2000).execute().data
    
    by_month = defaultdict(lambda: {"total": 0, "on_time": 0, "late": 0, "amount_due": 0.0, "amount_paid": 0.0})
    by_method = defaultdict(int)
    
    for p in payments:
        month = (p.get("payment_date") or "")[:7]
        by_month[month]["total"] += 1
        if p.get("is_late"):
            by_month[month]["late"] += 1
        else:
            by_month[month]["on_time"] += 1
        by_month[month]["amount_due"] += float(p.get("amount_due") or 0)
        by_month[month]["amount_paid"] += float(p.get("amount_paid") or 0)
        by_method[p.get("payment_method") or "cash"] += 1
    
    monthly = []
    for month in sorted(by_month.keys())[-12:]:
        d = by_month[month]
        monthly.append({
            "month": month,
            "collection_rate": round(d["amount_paid"] / d["amount_due"] * 100, 2) if d["amount_due"] else 0,
            "on_time_rate": round(d["on_time"] / d["total"] * 100, 2) if d["total"] else 0,
            "total_payments": d["total"],
            "late_count": d["late"],
        })
    
    return {"monthly_trends": monthly, "payment_methods": dict(by_method)}
