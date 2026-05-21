from fastapi import APIRouter, Depends
from routers.auth import verify_token
from config import get_supabase
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter()

class StressTestScenario(BaseModel):
    scenario_name: str
    scenario_type: str  # macro_shock, sector_shock, branch_shock, custom
    fuel_price_increase: float = 0  # % increase
    food_inflation: float = 0
    income_shock: float = 0  # % reduction in disposable income
    sector_affected: Optional[str] = None
    sector_par_multiplier: float = 1.0
    global_par_multiplier: float = 1.0
    branch_id: Optional[str] = None

@router.post("/run")
async def run_stress_test(scenario: StressTestScenario, token_data: dict = Depends(verify_token)):
    db = get_supabase()
    loans = db.table("loans").select("*").execute().data
    
    total_portfolio = sum(float(l.get("outstanding_balance") or 0) for l in loans)
    current_par30 = [l for l in loans if (l.get("par_days") or 0) > 30]
    current_par30_pct = len(current_par30) / len(loans) * 100 if loans else 0
    current_par30_amount = sum(float(l.get("outstanding_balance") or 0) for l in current_par30)
    current_npl = len([l for l in loans if l.get("status") in ["npl", "written_off"]]) / len(loans) * 100 if loans else 0
    
    # Compute stress impact
    macro_shock = 0
    if scenario.fuel_price_increase > 0:
        macro_shock += scenario.fuel_price_increase * 0.15  # 15% PAR sensitivity per 1% fuel increase
    if scenario.food_inflation > 0:
        macro_shock += scenario.food_inflation * 0.10
    if scenario.income_shock > 0:
        macro_shock += scenario.income_shock * 0.20
    
    stressed_par30_pct = current_par30_pct * scenario.global_par_multiplier + macro_shock
    stressed_npl = current_npl * (scenario.global_par_multiplier * 0.85) + macro_shock * 0.4
    
    # Sector impact
    sector_analysis = {}
    if scenario.sector_affected:
        sector_loans = [l for l in loans if l.get("sector") == scenario.sector_affected]
        sector_par = [l for l in sector_loans if (l.get("par_days") or 0) > 30]
        sector_par_pct = len(sector_par) / len(sector_loans) * 100 if sector_loans else 0
        sector_portfolio = sum(float(l.get("outstanding_balance") or 0) for l in sector_loans)
        stressed_sector_par = sector_par_pct * scenario.sector_par_multiplier + macro_shock * 1.5
        sector_analysis = {
            "sector": scenario.sector_affected,
            "portfolio": sector_portfolio,
            "current_par_pct": round(sector_par_pct, 2),
            "stressed_par_pct": round(min(100, stressed_sector_par), 2),
            "additional_at_risk": round(sector_portfolio * (stressed_sector_par - sector_par_pct) / 100, 0),
        }
    
    stressed_par30_pct = min(100, stressed_par30_pct)
    stressed_par30_amount = total_portfolio * stressed_par30_pct / 100
    additional_at_risk = stressed_par30_amount - current_par30_amount
    capital_impact = additional_at_risk * 0.60  # 60% loss given default assumption
    
    result = {
        "scenario_name": scenario.scenario_name,
        "scenario_type": scenario.scenario_type,
        "baseline": {
            "par30_pct": round(current_par30_pct, 2),
            "par30_amount": round(current_par30_amount, 0),
            "npl_pct": round(current_npl, 2),
            "total_portfolio": round(total_portfolio, 0),
        },
        "stressed": {
            "par30_pct": round(stressed_par30_pct, 2),
            "par30_amount": round(stressed_par30_amount, 0),
            "npl_pct": round(min(100, stressed_npl), 2),
            "additional_at_risk": round(additional_at_risk, 0),
            "capital_impact": round(capital_impact, 0),
        },
        "sector_analysis": sector_analysis,
        "risk_rating": "CRITICAL" if stressed_par30_pct > 20 else "HIGH" if stressed_par30_pct > 15 else "ELEVATED" if stressed_par30_pct > 10 else "MODERATE",
        "macro_shock_contribution": round(macro_shock, 2),
        "recommendations": _generate_recommendations(stressed_par30_pct, scenario),
    }
    
    # Save result
    try:
        db.table("stress_test_results").insert({
            "id": str(uuid.uuid4()),
            "scenario_name": scenario.scenario_name,
            "scenario_type": scenario.scenario_type,
            "parameters": scenario.dict(),
            "results": result,
            "created_by": token_data.get("email"),
        }).execute()
    except:
        pass
    
    return result

@router.get("/history")
async def stress_test_history(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("stress_test_results").select("id,scenario_name,scenario_type,created_by,created_at,results").order("created_at", desc=True).limit(20).execute()
    return result.data

@router.get("/predefined-scenarios")
async def predefined_scenarios(token_data: dict = Depends(verify_token)):
    return [
        {
            "name": "Fuel Crisis Scenario",
            "type": "macro_shock",
            "description": "18% fuel price increase — impacts transport & trade sectors",
            "params": {"fuel_price_increase": 18, "food_inflation": 5, "global_par_multiplier": 1.3},
        },
        {
            "name": "Agricultural Drought",
            "type": "sector_shock",
            "description": "Irregular rainfall — severe agricultural loan stress",
            "params": {"food_inflation": 25, "sector_affected": "agriculture", "sector_par_multiplier": 2.5, "global_par_multiplier": 1.1},
        },
        {
            "name": "Digital Lending Competition",
            "type": "macro_shock",
            "description": "Digital MFIs capture 30% of clients — repeat borrower decline",
            "params": {"income_shock": 10, "global_par_multiplier": 1.4},
        },
        {
            "name": "Full Economic Stress",
            "type": "macro_shock",
            "description": "Combined macro shock: fuel + inflation + income reduction",
            "params": {"fuel_price_increase": 18, "food_inflation": 22, "income_shock": 15, "global_par_multiplier": 1.8},
        },
    ]

def _generate_recommendations(stressed_par: float, scenario: StressTestScenario) -> list:
    recs = []
    if stressed_par > 20:
        recs.append("Immediately freeze disbursements in high-risk segments and branches.")
        recs.append("Activate emergency portfolio review committee within 5 business days.")
    if stressed_par > 15:
        recs.append("Increase provisioning for PAR loans by 50% above current levels.")
        recs.append("Deploy dedicated recovery teams to Eastern and Northern provinces.")
    if scenario.sector_affected == "agriculture":
        recs.append("Offer agricultural loan restructuring with grace period aligned to harvest season.")
        recs.append("Commission crop loss assessment in affected districts before new disbursements.")
    if scenario.fuel_price_increase > 10:
        recs.append("Reduce transport sector new loan approvals by 40% until fuel prices stabilize.")
    recs.append("Strengthen early warning monitoring: weekly PAR reporting for all branches.")
    recs.append("Review and tighten credit scoring thresholds for new loan applications.")
    return recs
