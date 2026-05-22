from fastapi import APIRouter, Depends
from routers.auth import verify_token
from config import get_supabase
from collections import defaultdict

router = APIRouter()

@router.get("/")
async def list_branches(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    branches = db.table("branches").select("*").order("name").execute().data

    # Enrich each branch with live loan + client stats
    loans = db.table("loans").select("branch_id,outstanding_balance,par_days,status").execute().data
    clients_data = db.table("clients").select("branch_id,id").execute().data

    # Build aggregates per branch
    branch_stats = defaultdict(lambda: {
        "total_loans": 0, "total_outstanding": 0.0,
        "par30_count": 0, "total_clients": 0
    })
    for l in loans:
        bid = l.get("branch_id")
        if bid:
            branch_stats[bid]["total_loans"] += 1
            branch_stats[bid]["total_outstanding"] += float(l.get("outstanding_balance") or 0)
            if (l.get("par_days") or 0) > 30:
                branch_stats[bid]["par30_count"] += 1

    for c in clients_data:
        bid = c.get("branch_id")
        if bid:
            branch_stats[bid]["total_clients"] += 1

    enriched = []
    for b in branches:
        bid = b["id"]
        stats = branch_stats[bid]
        outstanding = stats["total_outstanding"]
        par30_count = stats["par30_count"]
        total_loans = stats["total_loans"]
        par30_rate = round(par30_count / total_loans * 100, 2) if total_loans else 0

        enriched.append({
            **b,
            "total_loans": total_loans,
            "total_outstanding": outstanding,
            "total_clients": stats["total_clients"],
            "par30_count": par30_count,
            "par30_rate": par30_rate,
            # aliases used by frontend BranchCard
            "portfolio_size": outstanding,
            "loan_count": total_loans,
            "client_count": stats["total_clients"],
            "manager": b.get("manager_name"),
        })

    return enriched

@router.get("/{branch_id}")
async def branch_detail(branch_id: str, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    branch = db.table("branches").select("*").eq("id", branch_id).execute()
    loans = db.table("loans").select("id,principal_amount,outstanding_balance,status,par_days").eq("branch_id", branch_id).execute()
    clients_count = db.table("clients").select("id", count="exact").eq("branch_id", branch_id).execute()
    return {
        "branch": branch.data[0] if branch.data else None,
        "loan_summary": {
            "total_loans": len(loans.data),
            "total_outstanding": sum(float(l.get("outstanding_balance") or 0) for l in loans.data),
            "par_loans": sum(1 for l in loans.data if (l.get("par_days") or 0) > 30),
        },
        "total_clients": clients_count.count or 0,
    }

@router.get("/{branch_id}/performance")
async def branch_performance(branch_id: str, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("*").eq("branch_id", branch_id).execute()
    data = loans.data
    total_portfolio = sum(float(l.get("outstanding_balance") or 0) for l in data)
    par30 = sum(float(l.get("outstanding_balance") or 0) for l in data if (l.get("par_days") or 0) > 30)
    return {
        "branch_id": branch_id,
        "total_portfolio": total_portfolio,
        "par30_amount": par30,
        "par30_rate": round((par30 / total_portfolio * 100) if total_portfolio > 0 else 0, 2),
        "total_loans": len(data),
        "active_loans": sum(1 for l in data if l.get("status") == "active"),
    }
