from fastapi import APIRouter, Depends, Query
from routers.auth import verify_token
from config import get_supabase

router = APIRouter()

@router.get("/")
async def list_clients(
    page: int = 1,
    limit: int = 50,
    risk_category: str = None,
    branch_id: str = None,
    search: str = None,
    token_data: dict = Depends(verify_token)
):
    db = get_supabase()
    # Select clients - do not filter by is_active so seed data without that field still shows
    q = db.table("clients").select("*,branches(name,province)")
    if risk_category:
        q = q.eq("risk_category", risk_category)
    if branch_id:
        q = q.eq("branch_id", branch_id)
    if search:
        q = q.ilike("full_name", f"%{search}%")

    offset = (page - 1) * limit
    result = q.range(offset, offset + limit - 1).execute()
    return result.data

@router.get("/high-risk")
async def high_risk_clients(limit: int = 20, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    clients = db.table("clients").select("*,branches(name)").in_("risk_category", ["high", "critical"]).order("risk_score", desc=True).limit(limit).execute()
    return clients.data

@router.get("/{client_id}")
async def client_detail(client_id: str, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    client = db.table("clients").select("*,branches(name,province)").eq("id", client_id).execute()
    loans = db.table("loans").select("*").eq("client_id", client_id).execute()
    payments = db.table("payments").select("*").eq("client_id", client_id).order("payment_date", desc=True).limit(20).execute()
    return {
        "client": client.data[0] if client.data else None,
        "loans": loans.data,
        "payments": payments.data,
    }
