"""
AB Rwanda Risk Analytics Platform - Seed Data (No Email Column)
Run: python seed_no_email.py
"""
import random
import uuid
from datetime import date, timedelta
from supabase import create_client
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext

# Load .env
env_path = Path.cwd() / ".env"
load_dotenv(dotenv_path=env_path, override=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_KEY", "")

print(f"Connecting to: {SUPABASE_URL}")
print(f"Using key: {SUPABASE_KEY[:30]}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================
# 10 BRANCHES (without email column)
# ============================================
BRANCHES = [
    {"id": str(uuid.uuid4()), "name": "Kigali HQ", "province": "Kigali", "district": "Nyarugenge", "manager_name": "Jean Pierre Habimana", "phone": "+250788100001", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Musanze Branch", "province": "Northern", "district": "Musanze", "manager_name": "Marie Claire Uwimana", "phone": "+250788200002", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Nyagatare Branch", "province": "Eastern", "district": "Nyagatare", "manager_name": "Emmanuel Ndayambaje", "phone": "+250788300003", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Huye Branch", "province": "Southern", "district": "Huye", "manager_name": "Alphonsine Mukamana", "phone": "+250788400004", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Rubavu Branch", "province": "Western", "district": "Rubavu", "manager_name": "Patrick Nzeyimana", "phone": "+250788500005", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Muhanga Branch", "province": "Southern", "district": "Muhanga", "manager_name": "Solange Ingabire", "phone": "+250788600006", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Kayonza Branch", "province": "Eastern", "district": "Kayonza", "manager_name": "Jean Niyomugabo", "phone": "+250788700007", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Rusizi Branch", "province": "Western", "district": "Rusizi", "manager_name": "Claudine Uwamahoro", "phone": "+250788800008", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Gicumbi Branch", "province": "Northern", "district": "Gicumbi", "manager_name": "Theogene Hakizimana", "phone": "+250788900009", "is_active": True},
    {"id": str(uuid.uuid4()), "name": "Nyanza Branch", "province": "Southern", "district": "Nyanza", "manager_name": "Christine Nyirahabimana", "phone": "+250789000010", "is_active": True},
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
CLIENTS = []
for i in range(10):
    CLIENTS.append({
        "id": str(uuid.uuid4()),
        "client_code": f"ABR0100{i+1}",
        "full_name": f"Client {i+1}",
        "national_id": f"1198501234567890{i}",
        "phone": f"+25078812345{i}",
        "gender": "M" if i % 2 == 0 else "F",
        "date_of_birth": "1985-03-15",
        "province": "Kigali",
        "district": "Nyarugenge",
        "sector": "trade",
        "branch_id": None,
        "client_segment": "micro",
        "business_type": "retail_trade",
        "registration_date": "2023-01-10",
        "risk_score": 25.5,
        "risk_category": "low",
        "is_active": True,
    })

# ============================================
# 10 LOANS
# ============================================
LOANS = []
for i in range(10):
    LOANS.append({
        "id": str(uuid.uuid4()),
        "loan_number": f"LN10000{i+1}",
        "client_id": None,
        "branch_id": None,
        "product_id": PRODUCTS[0]["id"],
        "loan_officer": "LO001",
        "disbursement_date": "2025-01-15",
        "maturity_date": "2025-07-15",
        "principal_amount": 500000,
        "outstanding_balance": 250000,
        "interest_rate": 18.0,
        "term_months": 6,
        "status": "active",
        "par_days": 0,
        "days_past_due": 0,
        "restructured": False,
        "restructure_count": 0,
        "write_off_amount": 0,
        "sector": "trade",
    })

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
# 10 PAYMENTS (simplified)
# ============================================
PAYMENTS = []
for i in range(10):
    PAYMENTS.append({
        "id": str(uuid.uuid4()),
        "loan_id": None,
        "client_id": None,
        "branch_id": None,
        "payment_date": "2025-02-15",
        "scheduled_date": "2025-02-15",
        "amount_due": 85000,
        "amount_paid": 85000,
        "principal_paid": 63750,
        "interest_paid": 21250,
        "penalty_paid": 0,
        "payment_method": "cash",
        "is_late": False,
        "days_late": 0,
        "reference": f"REF100000{i}",
        "recorded_by": "LO001",
    })

def seed_all():
    print("=" * 60)
    print("AB Rwanda Risk Analytics Platform - Seed Data")
    print("=" * 60)

    # 1. Branches
    print("\n📊 Seeding branches...")
    for b in BRANCHES:
        supabase.table("branches").upsert(b).execute()
        print(f"   ✅ {b['name']}")
    print(f"   ✅ {len(BRANCHES)} branches seeded")

    # 2. Products
    print("\n📦 Seeding loan products...")
    for p in PRODUCTS:
        supabase.table("loan_products").upsert(p).execute()
    print(f"   ✅ {len(PRODUCTS)} products seeded")

    # 3. Users
    print("\n👤 Seeding users...")
    for u in USERS:
        supabase.table("users").upsert(u).execute()
    print(f"   ✅ {len(USERS)} users seeded")

    # 4. Clients
    print("\n👥 Seeding clients...")
    for i, c in enumerate(CLIENTS):
        c["branch_id"] = BRANCHES[i % len(BRANCHES)]["id"]
        supabase.table("clients").upsert(c).execute()
    print(f"   ✅ {len(CLIENTS)} clients seeded")

    # 5. Loans
    print("\n💰 Seeding loans...")
    for i, l in enumerate(LOANS):
        l["client_id"] = CLIENTS[i % len(CLIENTS)]["id"]
        l["branch_id"] = CLIENTS[i % len(CLIENTS)]["branch_id"]
        supabase.table("loans").upsert(l).execute()
    print(f"   ✅ {len(LOANS)} loans seeded")

    # 6. Payments
    print("\n💳 Seeding payments...")
    for i, p in enumerate(PAYMENTS):
        p["loan_id"] = LOANS[i % len(LOANS)]["id"]
        p["client_id"] = LOANS[i % len(LOANS)]["client_id"]
        p["branch_id"] = LOANS[i % len(LOANS)]["branch_id"]
        supabase.table("payments").upsert(p).execute()
    print(f"   ✅ {len(PAYMENTS)} payments seeded")

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
