from fastapi import APIRouter, Depends, HTTPException
from routers.auth import verify_token
from config import get_supabase, get_settings
from pydantic import BaseModel
from typing import Optional
import anthropic
from collections import defaultdict

router = APIRouter()

class AIRequest(BaseModel):
    context: str  # portfolio_review, branch_risk, client_risk, early_warning
    branch_id: Optional[str] = None
    question: Optional[str] = None

@router.post("/analyze")
async def ai_analyze(req: AIRequest, token_data: dict = Depends(verify_token)):
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(400, "AI service not configured. Add ANTHROPIC_API_KEY to .env")
    
    db = get_supabase()
    
    # Build context data
    context_data = {}
    
    if req.context in ["portfolio_review", "early_warning"]:
        loans = db.table("loans").select("sector,par_days,outstanding_balance,status,restructured").execute().data
        snaps = db.table("portfolio_snapshots").select("*").is_("branch_id", "null").order("snapshot_date", desc=True).limit(9).execute().data
        
        total = len(loans)
        par30 = sum(1 for l in loans if (l.get("par_days") or 0) > 30)
        npl = sum(1 for l in loans if l.get("status") in ["npl", "written_off"])
        restructured = sum(1 for l in loans if l.get("restructured"))
        
        context_data = {
            "total_loans": total,
            "par30_pct": round(par30/total*100, 2) if total else 0,
            "npl_pct": round(npl/total*100, 2) if total else 0,
            "restructured_pct": round(restructured/total*100, 2) if total else 0,
            "trend": [{"month": s["snapshot_date"][:7], "par30": s["par_30"], "npl": s["npl_ratio"]} for s in reversed(snaps)],
        }
    
    if req.branch_id:
        b_loans = db.table("loans").select("*").eq("branch_id", req.branch_id).execute().data
        b_alerts = db.table("risk_alerts").select("*").eq("branch_id", req.branch_id).eq("is_resolved", False).execute().data
        b_info = db.table("branches").select("*").eq("id", req.branch_id).execute().data
        context_data["branch"] = b_info[0] if b_info else {}
        context_data["branch_loans"] = len(b_loans)
        context_data["branch_par30"] = sum(1 for l in b_loans if (l.get("par_days") or 0) > 30)
        context_data["branch_alerts"] = len(b_alerts)
    
    system_prompt = """You are a senior risk analytics expert at AB Rwanda PLC, a microfinance institution in Rwanda. 
You provide concise, practical, and actionable risk analysis. You understand the Rwandan microfinance sector deeply — 
including PAR dynamics, client behavior in trade/agriculture/transport segments, regulatory context (BNR guidelines), 
and operational challenges in the Northern and Eastern provinces.

Respond in professional but accessible language. Structure your analysis with:
1. Key findings (bullet points)
2. Root cause assessment
3. Immediate actions (0-3 months)
4. Strategic recommendations (3-12 months)

Be specific, cite the data provided, and avoid generic advice."""

    user_message = f"""Context: {req.context}
Portfolio Data: {context_data}
{f'Specific Question: {req.question}' if req.question else ''}

Please provide your risk analysis and recommendations."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}]
    )
    
    recommendation = message.content[0].text
    
    # Save recommendation
    try:
        db.table("ai_recommendations").insert({
            "context": req.context,
            "prompt_summary": req.question or req.context,
            "recommendation": recommendation,
            "confidence_score": 0.85,
            "branch_id": req.branch_id,
            "created_by": token_data.get("email"),
        }).execute()
    except:
        pass
    
    return {"recommendation": recommendation, "context": req.context}

@router.get("/history")
async def ai_history(limit: int = 10, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("ai_recommendations").select("*,branches(name)").order("created_at", desc=True).limit(limit).execute()
    return result.data

@router.get("/quick-insights")
async def quick_insights(token_data: dict = Depends(verify_token)):
    """Pre-computed rule-based insights — no API key required"""
    db = get_supabase()
    loans = db.table("loans").select("sector,par_days,outstanding_balance,status,restructured,branch_id").execute().data
    
    total = len(loans)
    par30 = [l for l in loans if (l.get("par_days") or 0) > 30]
    par30_pct = len(par30) / total * 100 if total else 0
    
    insights = []
    
    if par30_pct > 10:
        insights.append({
            "type": "critical",
            "title": "PAR>30 Exceeds Critical Threshold",
            "body": f"Portfolio at risk stands at {par30_pct:.1f}%, significantly above the 5% industry benchmark. Immediate corrective action required.",
            "action": "Freeze new disbursements in high-risk branches and activate recovery task force.",
        })
    
    # Sector analysis
    sector_par = defaultdict(lambda: {"count": 0, "par": 0})
    for l in loans:
        s = l.get("sector") or "other"
        sector_par[s]["count"] += 1
        if (l.get("par_days") or 0) > 30:
            sector_par[s]["par"] += 1
    
    worst_sector = max(sector_par.items(), key=lambda x: x[1]["par"]/x[1]["count"] if x[1]["count"] else 0)
    if worst_sector[1]["count"] > 0:
        rate = worst_sector[1]["par"] / worst_sector[1]["count"] * 100
        if rate > 12:
            insights.append({
                "type": "high",
                "title": f"{worst_sector[0].title()} Sector Under Severe Stress",
                "body": f"The {worst_sector[0]} sector shows {rate:.1f}% PAR>30. This aligns with macroeconomic pressures on informal businesses in Rwanda.",
                "action": f"Suspend new {worst_sector[0]} loans pending sector cashflow review.",
            })
    
    restructured_pct = sum(1 for l in loans if l.get("restructured")) / total * 100 if total else 0
    if restructured_pct > 8:
        insights.append({
            "type": "high",
            "title": "Restructuring Rate Masks True Portfolio Quality",
            "body": f"At {restructured_pct:.1f}%, restructured loans are artificially suppressing NPL figures. True credit risk is higher than reported metrics suggest.",
            "action": "Commission independent portfolio quality review. Audit restructured loans for eligibility compliance.",
        })
    
    insights.append({
        "type": "medium",
        "title": "Early Warning: Repeat Borrower Decline",
        "body": "Declining repeat borrower rate signals client dissatisfaction or over-indebtedness. Clients may be migrating to digital lenders or defaulting silently.",
        "action": "Conduct client exit interviews. Deploy loan officer retention bonuses tied to repeat borrower rates.",
    })
    
    return insights
