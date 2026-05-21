from fastapi import APIRouter, Depends
from routers.auth import verify_token
from config import get_supabase
from collections import defaultdict
from datetime import datetime

router = APIRouter()

@router.get("/executive-summary")
async def executive_summary(token_data: dict = Depends(verify_token)):
    """Full executive summary for board/management reporting"""
    db = get_supabase()
    
    loans = db.table("loans").select("*").execute().data
    clients = db.table("clients").select("risk_category,is_active").execute().data
    branches = db.table("branches").select("*").execute().data
    alerts = db.table("risk_alerts").select("severity,is_resolved").execute().data
    snaps = db.table("portfolio_snapshots").select("*").is_("branch_id", "null").order("snapshot_date").execute().data
    
    total = len(loans)
    portfolio = sum(float(l.get("outstanding_balance") or 0) for l in loans)
    par30 = [l for l in loans if (l.get("par_days") or 0) > 30]
    npl = [l for l in loans if l.get("status") in ["npl", "written_off"]]
    
    # Trend comparison (Q1 vs Q3 from snapshots)
    trend_summary = {}
    if len(snaps) >= 6:
        q1 = snaps[:3]
        q3 = snaps[-3:]
        avg = lambda lst, k: sum(float(s.get(k) or 0) for s in lst) / len(lst)
        trend_summary = {
            "par30_q1": round(avg(q1, "par_30"), 2),
            "par30_q3": round(avg(q3, "par_30"), 2),
            "npl_q1": round(avg(q1, "npl_ratio"), 2),
            "npl_q3": round(avg(q3, "npl_ratio"), 2),
            "writeoff_q1": round(avg(q1, "write_offs"), 0),
            "writeoff_q3": round(avg(q3, "write_offs"), 0),
        }
    
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "period": "Q3 2025 / Q1 2026",
        "portfolio_overview": {
            "gross_loan_portfolio": round(portfolio, 0),
            "active_loans": total,
            "active_clients": len([c for c in clients if c.get("is_active")]),
            "branches": len(branches),
        },
        "risk_metrics": {
            "par30_pct": round(len(par30)/total*100, 2) if total else 0,
            "par30_amount": round(sum(float(l.get("outstanding_balance",0)) for l in par30), 0),
            "npl_pct": round(len(npl)/total*100, 2) if total else 0,
            "write_offs": round(sum(float(l.get("write_off_amount",0)) for l in loans), 0),
        },
        "trend_summary": trend_summary,
        "alerts": {
            "critical": sum(1 for a in alerts if a.get("severity") == "critical" and not a.get("is_resolved")),
            "high": sum(1 for a in alerts if a.get("severity") == "high" and not a.get("is_resolved")),
            "total_unresolved": sum(1 for a in alerts if not a.get("is_resolved")),
        },
        "risk_distribution": {cat: sum(1 for c in clients if c.get("risk_category") == cat) for cat in ["low", "medium", "high", "critical"]},
    }
