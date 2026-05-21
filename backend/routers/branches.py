from fastapi import APIRouter, Depends
from routers.auth import verify_token
from config import get_supabase

router = APIRouter()

@router.get("/")
async def list_branches(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("branches").select("*").eq("is_active", True).order("name").execute()
    return result.data

@router.get("/{branch_id}")
async def branch_detail(branch_id: str, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    branch = db.table("branches").select("*").eq("id", branch_id).execute()
    loans = db.table("loans").select("id,principal_amount,outstanding_balance,status,par_days").eq("branch_id", branch_id).execute()
    clients_count = db.table("clients").select("id", count="exact").eq("branch_id", branch_id).eq("is_active", True).execute()
    return {
        "branch": branch.data[0] if branch.data else None,
        "loan_summary": {
            "total_loans": len(loans.data),
            "total_outstanding": sum(l.get("outstanding_balance", 0) or 0 for l in loans.data),
            "par_loans": sum(1 for l in loans.data if (l.get("par_days") or 0) > 30),
        },
        "total_clients": clients_count.count or 0,
    }

@router.get("/{branch_id}/performance")
async def branch_performance(branch_id: str, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("*").eq("branch_id", branch_id).execute()
    data = loans.data
    total_portfolio = sum(l.get("outstanding_balance", 0) or 0 for l in data)
    par30 = sum(l.get("outstanding_balance", 0) or 0 for l in data if (l.get("par_days") or 0) > 30)
    return {
        "branch_id": branch_id,
        "total_portfolio": total_portfolio,
        "par30_amount": par30,
        "par30_rate": round((par30 / total_portfolio * 100) if total_portfolio > 0 else 0, 2),
        "total_loans": len(data),
        "active_loans": sum(1 for l in data if l.get("status") == "active"),
    }
