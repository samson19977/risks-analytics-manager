from fastapi import APIRouter, Depends, Query
from routers.auth import verify_token
from config import get_supabase
from collections import defaultdict

router = APIRouter()

@router.get("/summary")
async def portfolio_summary(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("*").execute().data
    clients = db.table("clients").select("risk_category,is_active").execute().data
    
    total_portfolio = sum(float(l.get("outstanding_balance") or 0) for l in loans)
    active_loans = [l for l in loans if l.get("status") == "active"]
    par30 = [l for l in loans if (l.get("par_days") or 0) > 30]
    par60 = [l for l in loans if (l.get("par_days") or 0) > 60]
    npl = [l for l in loans if l.get("status") in ["npl", "written_off"]]
    restructured = [l for l in loans if l.get("restructured")]
    written_off = [l for l in loans if l.get("status") == "written_off"]
    
    par30_amount = sum(float(l.get("outstanding_balance") or 0) for l in par30)
    npl_amount = sum(float(l.get("outstanding_balance") or 0) for l in npl)
    
    risk_dist = defaultdict(int)
    for c in clients:
        risk_dist[c.get("risk_category", "medium")] += 1
    
    return {
        "gross_loan_portfolio": total_portfolio,
        "active_loans": len(active_loans),
        "total_clients": len([c for c in clients if c.get("is_active")]),
        "par_30_count": len(par30),
        "par_30_pct": round(len(par30) / len(loans) * 100, 2) if loans else 0,
        "par_30_amount": par30_amount,
        "par_60_pct": round(len(par60) / len(loans) * 100, 2) if loans else 0,
        "npl_ratio": round(len(npl) / len(loans) * 100, 2) if loans else 0,
        "npl_amount": npl_amount,
        "restructured_loans": len(restructured),
        "restructured_pct": round(len(restructured) / len(loans) * 100, 2) if loans else 0,
        "write_offs_total": sum(float(l.get("write_off_amount") or 0) for l in written_off),
        "portfolio_risk_score": min(100, (len(par30)/len(loans)*40 + len(npl)/len(loans)*60) * 100) if loans else 0,
        "risk_distribution": dict(risk_dist),
        "collection_rate": round((1 - par30_amount/total_portfolio)*100, 2) if total_portfolio else 0,
    }

@router.get("/trends")
async def portfolio_trends(months: int = 9, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    snaps = db.table("portfolio_snapshots").select("*").is_("branch_id", "null").order("snapshot_date").execute().data
    
    # Aggregate by month
    by_month = defaultdict(lambda: {"glp": [], "par30": [], "npl": [], "writeoffs": [], "repeat": [], "restructured": [], "collection": []})
    for s in snaps:
        m = (s.get("snapshot_date") or "")[:7]
        by_month[m]["glp"].append(float(s.get("gross_loan_portfolio") or 0))
        by_month[m]["par30"].append(float(s.get("par_30") or 0))
        by_month[m]["npl"].append(float(s.get("npl_ratio") or 0))
        by_month[m]["writeoffs"].append(float(s.get("write_offs") or 0))
        by_month[m]["repeat"].append(float(s.get("repeat_borrower_rate") or 0))
        by_month[m]["restructured"].append(float(s.get("restructured_loans_pct") or 0))
        by_month[m]["collection"].append(float(s.get("collection_rate") or 0))
    
    result = []
    for month in sorted(by_month.keys())[-months:]:
        d = by_month[month]
        def avg(lst): return round(sum(lst)/len(lst), 2) if lst else 0
        result.append({
            "month": month,
            "gross_loan_portfolio": avg(d["glp"]),
            "par_30": avg(d["par30"]),
            "npl_ratio": avg(d["npl"]),
            "write_offs": avg(d["writeoffs"]),
            "repeat_borrower_rate": avg(d["repeat"]),
            "restructured_pct": avg(d["restructured"]),
            "collection_rate": avg(d["collection"]),
        })
    return result

@router.get("/sector-concentration")
async def sector_concentration(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("sector,outstanding_balance,par_days,status").execute().data
    
    sector_data = defaultdict(lambda: {"amount": 0, "count": 0, "par_count": 0})
    total = sum(float(l.get("outstanding_balance") or 0) for l in loans)
    
    for l in loans:
        s = l.get("sector") or "other"
        sector_data[s]["amount"] += float(l.get("outstanding_balance") or 0)
        sector_data[s]["count"] += 1
        if (l.get("par_days") or 0) > 30:
            sector_data[s]["par_count"] += 1
    
    result = []
    for sector, data in sector_data.items():
        pct = data["amount"] / total * 100 if total else 0
        par_rate = data["par_count"] / data["count"] * 100 if data["count"] else 0
        result.append({
            "sector": sector,
            "amount": data["amount"],
            "loan_count": data["count"],
            "percentage": round(pct, 2),
            "par_rate": round(par_rate, 2),
            "risk_level": "critical" if pct > 35 else "high" if pct > 25 else "medium" if pct > 15 else "low",
        })
    return sorted(result, key=lambda x: x["amount"], reverse=True)

@router.get("/par-aging")
async def par_aging(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("par_days,outstanding_balance").execute().data
    
    buckets = {
        "current": (0, 0), "par_1_30": (0, 0),
        "par_31_90": (0, 0), "par_91_180": (0, 0), "par_180_plus": (0, 0),
    }
    for l in loans:
        d = l.get("par_days") or 0
        amt = float(l.get("outstanding_balance") or 0)
        if d == 0:
            k = "current"
        elif d <= 30:
            k = "par_1_30"
        elif d <= 90:
            k = "par_31_90"
        elif d <= 180:
            k = "par_91_180"
        else:
            k = "par_180_plus"
        c, a = buckets[k]
        buckets[k] = (c + 1, a + amt)
    
    return [{"bucket": k, "loan_count": v[0], "amount": v[1]} for k, v in buckets.items()]

@router.get("/geographic-distribution")
async def geographic_distribution(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    branches = db.table("branches").select("id,name,province").execute().data
    loans = db.table("loans").select("branch_id,outstanding_balance,par_days").execute().data
    
    branch_map = {b["id"]: b for b in branches}
    province_data = defaultdict(lambda: {"amount": 0, "count": 0, "par": 0})
    
    for l in loans:
        bid = l.get("branch_id")
        if bid and bid in branch_map:
            prov = branch_map[bid]["province"]
            province_data[prov]["amount"] += float(l.get("outstanding_balance") or 0)
            province_data[prov]["count"] += 1
            if (l.get("par_days") or 0) > 30:
                province_data[prov]["par"] += 1
    
    return [{"province": p, **{k: round(v, 2) if isinstance(v, float) else v for k, v in d.items()},
             "par_rate": round(d["par"]/d["count"]*100, 2) if d["count"] else 0}
            for p, d in province_data.items()]
