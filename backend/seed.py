"""
AB Rwanda Risk Analytics Platform v3 - Seed Data (10 Records Each)
Run: python seed.py
"""
import random
import uuid
from datetime import date, timedelta, datetime
from supabase import create_client
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext

# Explicitly load .env from current directory
env_path = Path.cwd() / ".env"
print(f"Looking for .env at: {env_path}")
print(f"File exists: {env_path.exists()}")

load_dotenv(dotenv_path=env_path, override=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_KEY", "")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY (first 20): {SUPABASE_KEY[:20] if SUPABASE_KEY else 'EMPTY'}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================
# 10 BRANCHES
# ============================================
BRANCHES = [
    {"id": str(uuid.uuid4()), "name": "Kigali HQ", "province": "Kigali", "district": "Nyarugenge", "manager_name": "Jean Pierre Habimana", "phone": "+250788100001", "email": "kigali@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Musanze Branch", "province": "Northern", "district": "Musanze", "manager_name": "Marie Claire Uwimana", "phone": "+250788200002", "email": "musanze@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Nyagatare Branch", "province": "Eastern", "district": "Nyagatare", "manager_name": "Emmanuel Ndayambaje", "phone": "+250788300003", "email": "nyagatare@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Huye Branch", "province": "Southern", "district": "Huye", "manager_name": "Alphonsine Mukamana", "phone": "+250788400004", "email": "huye@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Rubavu Branch", "province": "Western", "district": "Rubavu", "manager_name": "Patrick Nzeyimana", "phone": "+250788500005", "email": "rubavu@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Muhanga Branch", "province": "Southern", "district": "Muhanga", "manager_name": "Solange Ingabire", "phone": "+250788600006", "email": "muhanga@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Kayonza Branch", "province": "Eastern", "district": "Kayonza", "manager_name": "Jean Niyomugabo", "phone": "+250788700007", "email": "kayonza@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Rusizi Branch", "province": "Western", "district": "Rusizi", "manager_name": "Claudine Uwamahoro", "phone": "+250788800008", "email": "rusizi@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Gicumbi Branch", "province": "Northern", "district": "Gicumbi", "manager_name": "Theogene Hakizimana", "phone": "+250788900009", "email": "gicumbi@abrwanda.com", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Nyanza Branch", "province": "Southern", "district": "Nyanza", "manager_name": "Christine Nyirahabimana", "phone": "+250789000010", "email": "nyanza@abrwanda.com", "is_active": True},
]

# ============================================
# 5 LOAN PRODUCTS
# ============================================
PRODUCTS = [
    {"id": str(uuid.uuid4()), "name": "Micro Business Loan", "code": "MBL", "min_amount": 100000, "max_amount": 2000000, "min_term_months": 6, "max_term_months": 24, "interest_rate": 18.0},
    {"id": str(uuid.uuid4()), "name": "Agricultural Loan", "code": "AGL", "min_amount": 200000, "max_amount": 5000000, "min_term_months": 6, "max_term_months": 36, "interest_rate": 16.0},
    {"id": str(uuid.uuid4()), "name": "SME Loan", "code": "SME", "min_amount": 1000000, "max_amount": 50000000, "min_term_months": 12, "max_term_months": 60, "interest_rate": 20.0},
    {"id": str(uuid.uuid4()), "name": "Transport Loan", "code": "TRL", "min_amount": 500000, "max_amount": 10000000, "min_term_months": 12, "max_term_months": 48, "interest_rate": 22.0},
    {"id": str(uuid.uuid4()), "name": "Housing Improvement Loan", "code": "HIL", "min_amount": 500000, "max_amount": 15000000, "min_term_months": 24, "max_term_months": 84, "interest_rate": 17.0},
]

# ============================================
# 10 CLIENTS
# ============================================
CLIENTS = [
    {"id": str(uuid.uuid4()), "client_code": "ABR01001", "full_name": "Jean Habimana", "national_id": "11985012345678901", "phone": "+250788123456", "gender": "M", "date_of_birth": "1985-03-15", "province": "Kigali", "district": "Nyarugenge", "sector": "trade", "branch_id": None, "client_segment": "micro", "business_type": "retail_trade", "registration_date": "2023-01-10", "risk_score": 25.5, "risk_category": "low", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01002", "full_name": "Marie Uwimana", "national_id": "11990023456789012", "phone": "+250789234567", "gender": "F", "date_of_birth": "1990-07-22", "province": "Kigali", "district": "Gasabo", "sector": "agriculture", "branch_id": None, "client_segment": "agriculture", "business_type": "agriculture", "registration_date": "2023-02-15", "risk_score": 68.3, "risk_category": "medium", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01003", "full_name": "Emmanuel Ndayambaje", "national_id": "11975034567890123", "phone": "+250781345678", "gender": "M", "date_of_birth": "1975-11-30", "province": "Northern", "district": "Musanze", "sector": "transport", "branch_id": None, "client_segment": "transport", "business_type": "motorcycle_taxi", "registration_date": "2022-11-20", "risk_score": 85.7, "risk_category": "high", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01004", "full_name": "Alice Mukamana", "national_id": "11988045678901234", "phone": "+250782456789", "gender": "F", "date_of_birth": "1988-04-18", "province": "Northern", "district": "Musanze", "sector": "manufacturing", "branch_id": None, "client_segment": "sme", "business_type": "food_processing", "registration_date": "2023-03-01", "risk_score": 42.1, "risk_category": "medium", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01005", "full_name": "Patrick Nzeyimana", "national_id": "11982056789012345", "phone": "+250783567890", "gender": "M", "date_of_birth": "1982-09-25", "province": "Eastern", "district": "Nyagatare", "sector": "trade", "branch_id": None, "client_segment": "micro", "business_type": "retail_trade", "registration_date": "2023-01-22", "risk_score": 92.3, "risk_category": "critical", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01006", "full_name": "Solange Ingabire", "national_id": "11995067890123456", "phone": "+250784678901", "gender": "F", "date_of_birth": "1995-12-10", "province": "Eastern", "district": "Nyagatare", "sector": "agriculture", "branch_id": None, "client_segment": "agriculture", "business_type": "agriculture", "registration_date": "2023-04-05", "risk_score": 18.7, "risk_category": "low", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01007", "full_name": "Eric Nsanzimana", "national_id": "11970078901234567", "phone": "+250785789012", "gender": "M", "date_of_birth": "1970-06-08", "province": "Southern", "district": "Huye", "sector": "construction", "branch_id": None, "client_segment": "sme", "business_type": "construction", "registration_date": "2022-09-15", "risk_score": 72.4, "risk_category": "high", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01008", "full_name": "Grace Uwase", "national_id": "11992089012345678", "phone": "+250786890123", "gender": "F", "date_of_birth": "1992-02-28", "province": "Southern", "district": "Huye", "sector": "services", "branch_id": None, "client_segment": "sme", "business_type": "salon", "registration_date": "2023-01-30", "risk_score": 35.2, "risk_category": "low", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01009", "full_name": "Peter Niyonzima", "national_id": "11987090123456789", "phone": "+250787901234", "gender": "M", "date_of_birth": "1987-10-20", "province": "Western", "district": "Rubavu", "sector": "transport", "branch_id": None, "client_segment": "transport", "business_type": "motorcycle_taxi", "registration_date": "2022-12-10", "risk_score": 88.5, "risk_category": "high", "is_active": True},
    {"id": str(uuid.uuid4()), "client_code": "ABR01010", "full_name": "Diane Mutesi", "national_id": "11983001234567890", "phone": "+250788012345", "gender": "F", "date_of_birth": "1983-05-14", "province": "Western", "district": "Rubavu", "sector": "trade", "branch_id": None, "client_segment": "micro", "business_type": "retail_trade", "registration_date": "2023-02-20", "risk_score": 55.0, "risk_category": "medium", "is_active": True},
]

# ============================================
# 10 LOANS
# ============================================
LOANS = [
    {"id": str(uuid.uuid4()), "loan_number": "LN100001", "client_id": None, "branch_id": None, "product_id": PRODUCTS[0]["id"], "loan_officer": "LO001", "disbursement_date": "2025-01-15", "maturity_date": "2025-07-15", "principal_amount": 500000, "outstanding_balance": 250000, "interest_rate": 18.0, "term_months": 6, "status": "active", "par_days": 0, "days_past_due": 0, "restructured": False, "restructure_count": 0, "write_off_amount": 0, "sector": "trade"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100002", "client_id": None, "branch_id": None, "product_id": PRODUCTS[1]["id"], "loan_officer": "LO001", "disbursement_date": "2024-10-10", "maturity_date": "2025-10-10", "principal_amount": 1200000, "outstanding_balance": 850000, "interest_rate": 16.0, "term_months": 12, "status": "active", "par_days": 45, "days_past_due": 45, "restructured": False, "restructure_count": 0, "write_off_amount": 0, "sector": "agriculture"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100003", "client_id": None, "branch_id": None, "product_id": PRODUCTS[0]["id"], "loan_officer": "LO002", "disbursement_date": "2024-08-05", "maturity_date": "2025-02-05", "principal_amount": 750000, "outstanding_balance": 720000, "interest_rate": 18.0, "term_months": 6, "status": "npl", "par_days": 180, "days_past_due": 180, "restructured": False, "restructure_count": 0, "write_off_amount": 750000, "sector": "transport"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100004", "client_id": None, "branch_id": None, "product_id": PRODUCTS[2]["id"], "loan_officer": "LO002", "disbursement_date": "2024-12-01", "maturity_date": "2025-12-01", "principal_amount": 2500000, "outstanding_balance": 2200000, "interest_rate": 20.0, "term_months": 12, "status": "active", "par_days": 0, "days_past_due": 0, "restructured": False, "restructure_count": 0, "write_off_amount": 0, "sector": "manufacturing"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100005", "client_id": None, "branch_id": None, "product_id": PRODUCTS[3]["id"], "loan_officer": "LO003", "disbursement_date": "2024-11-20", "maturity_date": "2025-11-20", "principal_amount": 800000, "outstanding_balance": 600000, "interest_rate": 22.0, "term_months": 12, "status": "restructured", "par_days": 90, "days_past_due": 90, "restructured": True, "restructure_count": 1, "write_off_amount": 0, "sector": "transport"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100006", "client_id": None, "branch_id": None, "product_id": PRODUCTS[0]["id"], "loan_officer": "LO003", "disbursement_date": "2025-02-10", "maturity_date": "2025-08-10", "principal_amount": 350000, "outstanding_balance": 350000, "interest_rate": 18.0, "term_months": 6, "status": "active", "par_days": 0, "days_past_due": 0, "restructured": False, "restructure_count": 0, "write_off_amount": 0, "sector": "trade"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100007", "client_id": None, "branch_id": None, "product_id": PRODUCTS[1]["id"], "loan_officer": "LO004", "disbursement_date": "2024-09-15", "maturity_date": "2025-09-15", "principal_amount": 2000000, "outstanding_balance": 1500000, "interest_rate": 16.0, "term_months": 12, "status": "active", "par_days": 30, "days_past_due": 30, "restructured": False, "restructure_count": 0, "write_off_amount": 0, "sector": "agriculture"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100008", "client_id": None, "branch_id": None, "product_id": PRODUCTS[4]["id"], "loan_officer": "LO004", "disbursement_date": "2024-07-01", "maturity_date": "2026-07-01", "principal_amount": 5000000, "outstanding_balance": 4800000, "interest_rate": 17.0, "term_months": 24, "status": "active", "par_days": 0, "days_past_due": 0, "restructured": False, "restructure_count": 0, "write_off_amount": 0, "sector": "services"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100009", "client_id": None, "branch_id": None, "product_id": PRODUCTS[2]["id"], "loan_officer": "LO005", "disbursement_date": "2024-06-10", "maturity_date": "2025-06-10", "principal_amount": 1500000, "outstanding_balance": 1400000, "interest_rate": 20.0, "term_months": 12, "status": "npl", "par_days": 210, "days_past_due": 210, "restructured": False, "restructure_count": 0, "write_off_amount": 1500000, "sector": "construction"},
    {"id": str(uuid.uuid4()), "loan_number": "LN100010", "client_id": None, "branch_id": None, "product_id": PRODUCTS[0]["id"], "loan_officer": "LO005", "disbursement_date": "2025-01-05", "maturity_date": "2025-07-05", "principal_amount": 450000, "outstanding_balance": 200000, "interest_rate": 18.0, "term_months": 6, "status": "restructured", "par_days": 15, "days_past_due": 15, "restructured": True, "restructure_count": 1, "write_off_amount": 0, "sector": "education"},
]

# ============================================
# 10 PAYMENTS
# ============================================
PAYMENTS = [
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2025-02-15", "scheduled_date": "2025-02-15", "amount_due": 85000, "amount_paid": 85000, "principal_paid": 63750, "interest_paid": 21250, "penalty_paid": 0, "payment_method": "cash", "is_late": False, "days_late": 0, "reference": "REF1000001", "recorded_by": "LO001"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2025-03-15", "scheduled_date": "2025-03-15", "amount_due": 85000, "amount_paid": 85000, "principal_paid": 63750, "interest_paid": 21250, "penalty_paid": 0, "payment_method": "mobile_money", "is_late": False, "days_late": 0, "reference": "REF1000002", "recorded_by": "LO001"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2024-11-10", "scheduled_date": "2024-11-10", "amount_due": 100000, "amount_paid": 100000, "principal_paid": 75000, "interest_paid": 25000, "penalty_paid": 0, "payment_method": "mobile_money", "is_late": False, "days_late": 0, "reference": "REF1000004", "recorded_by": "LO001"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2024-12-10", "scheduled_date": "2024-12-10", "amount_due": 100000, "amount_paid": 85000, "principal_paid": 63750, "interest_paid": 21250, "penalty_paid": 0, "payment_method": "cash", "is_late": True, "days_late": 5, "reference": "REF1000005", "recorded_by": "LO001"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2025-01-10", "scheduled_date": "2025-01-10", "amount_due": 100000, "amount_paid": 80000, "principal_paid": 60000, "interest_paid": 20000, "penalty_paid": 0, "payment_method": "mobile_money", "is_late": True, "days_late": 15, "reference": "REF1000006", "recorded_by": "LO001"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2024-09-05", "scheduled_date": "2024-09-05", "amount_due": 125000, "amount_paid": 125000, "principal_paid": 93750, "interest_paid": 31250, "penalty_paid": 0, "payment_method": "cash", "is_late": False, "days_late": 0, "reference": "REF1000007", "recorded_by": "LO002"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2024-10-05", "scheduled_date": "2024-10-05", "amount_due": 125000, "amount_paid": 0, "principal_paid": 0, "interest_paid": 0, "penalty_paid": 0, "payment_method": "mobile_money", "is_late": True, "days_late": 60, "reference": "REF1000008", "recorded_by": "LO002"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2025-01-01", "scheduled_date": "2025-01-01", "amount_due": 208333, "amount_paid": 208333, "principal_paid": 156250, "interest_paid": 52083, "penalty_paid": 0, "payment_method": "bank_transfer", "is_late": False, "days_late": 0, "reference": "REF1000009", "recorded_by": "LO002"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2025-02-01", "scheduled_date": "2025-02-01", "amount_due": 208333, "amount_paid": 208333, "principal_paid": 156250, "interest_paid": 52083, "penalty_paid": 0, "payment_method": "cash", "is_late": False, "days_late": 0, "reference": "REF1000010", "recorded_by": "LO002"},
    {"id": str(uuid.uuid4()), "loan_id": None, "client_id": None, "branch_id": None, "payment_date": "2025-03-01", "scheduled_date": "2025-03-01", "amount_due": 208333, "amount_paid": 200000, "principal_paid": 150000, "interest_paid": 50000, "penalty_paid": 0, "payment_method": "mobile_money", "is_late": True, "days_late": 10, "reference": "REF1000011", "recorded_by": "LO002"},
]

# ============================================
# 5 USERS
# ============================================
USERS = [
    {"id": str(uuid.uuid4()), "email": "admin@abrwanda.com", "full_name": "Admin User", "hashed_password": pwd_context.hash("admin123"), "role": "admin", "is_active": True},
    {"id": str(uuid.uuid4()), "email": "risk@abrwanda.com", "full_name": "Risk Manager", "hashed_password": pwd_context.hash("risk123"), "role": "risk_manager", "is_active": True},
    {"id": str(uuid.uuid4()), "email": "analyst@abrwanda.com", "full_name": "Portfolio Analyst", "hashed_password": pwd_context.hash("analyst123"), "role": "analyst", "is_active": True},
    {"id": str(uuid.uuid4()), "email": "branch@abrwanda.com", "full_name": "Branch Manager", "hashed_password": pwd_context.hash("branch123"), "role": "branch_manager", "is_active": True},
    {"id": str(uuid.uuid4()), "email": "viewer@abrwanda.com", "full_name": "Executive Viewer", "hashed_password": pwd_context.hash("viewer123"), "role": "viewer", "is_active": True},
]

# ============================================
# 10 RISK ALERTS
# ============================================
ALERTS = [
    {"id": str(uuid.uuid4()), "alert_type": "par_spike", "severity": "critical", "title": "PAR>30 Spike Detected", "description": "PAR>30 exceeded 12% threshold in Kigali region", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "concentration_risk", "severity": "high", "title": "Sector Concentration Warning", "description": "Agriculture exceeds 35% of portfolio", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "fraud_suspected", "severity": "critical", "title": "Suspicious Transaction Pattern", "description": "Unusual month-end disbursement spike detected", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "multiple_loans", "severity": "high", "title": "Multi-Institution Borrowing Alert", "description": "Client with loans from 4+ institutions identified", "branch_id": None, "is_resolved": True},
    {"id": str(uuid.uuid4()), "alert_type": "repeat_borrower_decline", "severity": "medium", "title": "Repeat Borrower Rate Declining", "description": "Rate dropped below 50% — client retention risk", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "npl_threshold", "severity": "high", "title": "NPL Ratio Breach", "description": "NPL ratio exceeded 7% regulatory warning threshold", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "write_off_increase", "severity": "high", "title": "Write-Off Volume Spike", "description": "Write-offs increased 89% quarter-over-quarter", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "loan_officer_risk", "severity": "medium", "title": "Loan Officer Portfolio Concern", "description": "Officer portfolio PAR exceeds 15%", "branch_id": None, "is_resolved": True},
    {"id": str(uuid.uuid4()), "alert_type": "par_trend", "severity": "critical", "title": "Deteriorating PAR Trend", "description": "PAR>30 has increased for 3 consecutive months", "branch_id": None, "is_resolved": False},
    {"id": str(uuid.uuid4()), "alert_type": "liquidity_risk", "severity": "high", "title": "Liquidity Pressure Warning", "description": "Collections dropped below 90% for two months", "branch_id": None, "is_resolved": False},
]

# ============================================
# 5 FRAUD SIGNALS
# ============================================
FRAUD_SIGNALS = [
    {"id": str(uuid.uuid4()), "signal_type": "month_end_disbursement_spike", "severity": "high", "description": "Auto-detected anomaly at Kigali HQ — 12 disbursements on month-end", "branch_id": None, "loan_officer": "LO001", "is_investigated": False},
    {"id": str(uuid.uuid4()), "signal_type": "multiple_active_loans", "severity": "critical", "description": "Client has 4 active loans simultaneously", "branch_id": None, "loan_officer": "LO002", "is_investigated": True},
    {"id": str(uuid.uuid4()), "signal_type": "high_restructuring_rate", "severity": "high", "description": "Loan officer has 35% restructuring rate", "branch_id": None, "loan_officer": "LO003", "is_investigated": False},
    {"id": str(uuid.uuid4()), "signal_type": "payment_date_clustering", "severity": "medium", "description": "80% of payments occur on day 1 of month — artificial pattern", "branch_id": None, "loan_officer": None, "is_investigated": False},
    {"id": str(uuid.uuid4()), "signal_type": "possible_misclassification", "severity": "high", "description": "Loans with PAR>180 classified as active", "branch_id": None, "loan_officer": None, "is_investigated": False},
]

# ============================================
# 9 PORTFOLIO SNAPSHOTS (monthly trend)
# ============================================
def create_snapshots():
    snapshots = []
    base_date = date.today() - timedelta(days=270)
    for month_offset in range(9):
        snap_date = base_date + timedelta(days=30 * month_offset)
        par_trend = 4.9 + (month_offset * 0.65)
        npl_trend = 3.1 + (month_offset * 0.48)
        snapshots.append({
            "id": str(uuid.uuid4()),
            "snapshot_date": str(snap_date),
            "branch_id": None,
            "sector": None,
            "gross_loan_portfolio": 8_000_000_000 + (month_offset * 500_000_000),
            "active_loans": 1200 + (month_offset * 50),
            "active_clients": 1100 + (month_offset * 45),
            "disbursements": 500_000_000 + (month_offset * 75_000_000),
            "par_30": round(par_trend, 2),
            "par_60": round(par_trend - 2, 2),
            "par_90": round(par_trend - 3.5, 2),
            "npl_ratio": round(npl_trend, 2),
            "write_offs": 50_000_000 + (month_offset * 15_000_000),
            "restructured_loans_pct": round(3.0 + (month_offset * 0.9), 2),
            "repeat_borrower_rate": round(62 - (month_offset * 1.8), 1),
            "avg_loan_size": 650_000 + (month_offset * 25_000),
            "collection_rate": round(96 - (month_offset * 0.7), 2),
        })
    return snapshots

def seed_all():
    print("=" * 60)
    print("AB Rwanda Risk Analytics Platform - Seed Data (10 Records Each)")
    print("=" * 60)

    # 1. Branches
    print("\n📊 Seeding branches...")
    for b in BRANCHES:
        supabase.table("branches").upsert(b).execute()
    print(f"   ✅ {len(BRANCHES)} branches seeded")

    # 2. Products
    print("📦 Seeding loan products...")
    for p in PRODUCTS:
        supabase.table("loan_products").upsert(p).execute()
    print(f"   ✅ {len(PRODUCTS)} products seeded")

    # 3. Users
    print("👤 Seeding users...")
    for u in USERS:
        supabase.table("users").upsert(u).execute()
    print(f"   ✅ {len(USERS)} users seeded")

    # 4. Clients (assign random branch)
    print("👥 Seeding clients...")
    for i, c in enumerate(CLIENTS):
        c["branch_id"] = BRANCHES[i % len(BRANCHES)]["id"]
        supabase.table("clients").upsert(c).execute()
    print(f"   ✅ {len(CLIENTS)} clients seeded")

    # 5. Loans (assign random client and branch)
    print("💰 Seeding loans...")
    for i, l in enumerate(LOANS):
        l["client_id"] = CLIENTS[i % len(CLIENTS)]["id"]
        l["branch_id"] = CLIENTS[i % len(CLIENTS)]["branch_id"]
        supabase.table("loans").upsert(l).execute()
    print(f"   ✅ {len(LOANS)} loans seeded")

    # 6. Payments (assign random loan)
    print("💳 Seeding payments...")
    for i, p in enumerate(PAYMENTS):
        p["loan_id"] = LOANS[i % len(LOANS)]["id"]
        p["client_id"] = LOANS[i % len(LOANS)]["client_id"]
        p["branch_id"] = LOANS[i % len(LOANS)]["branch_id"]
        supabase.table("payments").upsert(p).execute()
    print(f"   ✅ {len(PAYMENTS)} payments seeded")

    # 7. Portfolio Snapshots
    print("📈 Seeding portfolio snapshots...")
    snapshots = create_snapshots()
    for s in snapshots:
        supabase.table("portfolio_snapshots").upsert(s).execute()
    print(f"   ✅ {len(snapshots)} snapshots seeded")

    # 8. Risk Alerts
    print("⚠️ Seeding risk alerts...")
    for a in ALERTS:
        a["branch_id"] = BRANCHES[random.randint(0, len(BRANCHES)-1)]["id"]
        supabase.table("risk_alerts").upsert(a).execute()
    print(f"   ✅ {len(ALERTS)} alerts seeded")

    # 9. Fraud Signals
    print("🔍 Seeding fraud signals...")
    for f in FRAUD_SIGNALS:
        f["branch_id"] = BRANCHES[random.randint(0, len(BRANCHES)-1)]["id"]
        supabase.table("fraud_signals").upsert(f).execute()
    print(f"   ✅ {len(FRAUD_SIGNALS)} fraud signals seeded")

    print("\n" + "=" * 60)
    print("✅ All data seeded successfully!")
    print("=" * 60)
    print("\n🔐 Demo Login Credentials:")
    print("   Admin:        admin@abrwanda.com     / admin123")
    print("   Risk Manager: risk@abrwanda.com      / risk123")
    print("   Analyst:      analyst@abrwanda.com   / analyst123")
    print("   Branch Mgr:   branch@abrwanda.com    / branch123")
    print("   Viewer:       viewer@abrwanda.com    / viewer123")

if __name__ == "__main__":
    seed_all()
