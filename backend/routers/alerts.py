from fastapi import APIRouter, Depends, Query
from routers.auth import verify_token
from config import get_supabase
from pydantic import BaseModel

router = APIRouter()

class ResolveAlert(BaseModel):
    resolved_by: str
    notes: str = ""

@router.get("/")
async def list_alerts(
    severity: str = None,
    is_resolved: bool = False,
    limit: int = 50,
    token_data: dict = Depends(verify_token)
):
    db = get_supabase()
    q = db.table("risk_alerts").select("*,branches(name)").eq("is_resolved", is_resolved).order("created_at", desc=True)
    if severity:
        q = q.eq("severity", severity)
    result = q.limit(limit).execute()
    return result.data

@router.get("/summary")
async def alerts_summary(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    all_alerts = db.table("risk_alerts").select("severity,is_resolved").execute().data
    
    critical = sum(1 for a in all_alerts if a["severity"] == "critical" and not a["is_resolved"])
    high = sum(1 for a in all_alerts if a["severity"] == "high" and not a["is_resolved"])
    medium = sum(1 for a in all_alerts if a["severity"] == "medium" and not a["is_resolved"])
    unresolved = sum(1 for a in all_alerts if not a["is_resolved"])
    
    return {"critical": critical, "high": high, "medium": medium, "unresolved": unresolved, "total": len(all_alerts)}

@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, body: ResolveAlert, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    from datetime import datetime
    db.table("risk_alerts").update({
        "is_resolved": True,
        "resolved_by": body.resolved_by,
        "resolved_at": datetime.utcnow().isoformat(),
    }).eq("id", alert_id).execute()
    return {"success": True}
