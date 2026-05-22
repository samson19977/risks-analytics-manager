"""
AB Rwanda Risk Analytics Platform - Full Seed
Run: python seed_full.py
"""
import random
import uuid
from datetime import date, timedelta, datetime
from supabase import create_client
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext

load_dotenv(dotenv_path=Path.cwd() / ".env", override=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_KEY", "")
print(f"Connecting to: {SUPABASE_URL}")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")

db = create_client(SUPABASE_URL, SUPABASE_KEY)
random.seed(42)

BRANCHES = [
    {"name": "Kigali HQ",       "province": "Kigali",   "district": "Nyarugenge", "manager_name": "Jean Pierre Habimana",    "phone": "+250788100001"},
    {"name": "Musanze Branch",   "province": "Northern", "district": "Musanze",    "manager_name": "Marie Claire Uwimana",    "phone": "+250788200002"},
    {"name": "Nyagatare Branch", "province": "Eastern",  "district": "Nyagatare",  "manager_name": "Emmanuel Ndayambaje",     "phone": "+250788300003"},
    {"name": "Huye Branch",      "province": "Southern", "district": "Huye",       "manager_name": "Alphonsine Mukamana",     "phone": "+250788400004"},
    {"name": "Rubavu Branch",    "province": "Western",  "district": "Rubavu",     "manager_name": "Patrick Nzeyimana",       "phone": "+250788500005"},
    {"name": "Muhanga Branch",   "province": "Southern", "district": "Muhanga",    "manager_name": "Solange Ingabire",        "phone": "+250788600006"},
    {"name": "Kayonza Branch",   "province": "Eastern",  "district": "Kayonza",    "manager_name": "Jean Niyomugabo",         "phone": "+250788700007"},
    {"name": "Rusizi Branch",    "province": "Western",  "district": "Rusizi",     "manager_name": "Claudine Uwamahoro",      "phone": "+250788800008"},
    {"name": "Gicumbi Branch",   "province": "Northern", "district": "Gicumbi",    "manager_name": "Theogene Hakizimana",     "phone": "+250788900009"},
    {"name": "Nyanza Branch",    "province": "Southern", "district": "Nyanza",     "manager_name": "Christine Nyirahabimana", "phone": "+250789000010"},
]

SECTORS = ["agriculture", "trade", "services", "manufacturing", "transport", "education", "health", "construction"]
FIRST_NAMES = ["Jean", "Marie", "Emmanuel", "Alphonsine", "Patrick", "Solange", "Claude", "Theogene",
               "Christine", "Innocent", "Angelique", "Celestin", "Diane", "Eric", "Francoise", "Gerard",
               "Honorine", "Ines", "Jerome", "Keza", "Laurent", "Marguerite", "Nathan", "Odette"]
LAST_NAMES = ["Habimana", "Uwimana", "Ndayambaje", "Mukamana", "Nzeyimana", "Ingabire", "Niyomugabo",
              "Uwamahoro", "Hakizimana", "Nyirahabimana", "Bizimana", "Gasana", "Habyarimana",
              "Kamali", "Mugisha", "Nkurunziza", "Rutayisire", "Tuyishime", "Uwineza"]
LOAN_OFFICERS = ["Alice Mukamana", "Bob Nzeyimana", "Carol Ingabire", "David Gasana",
                 "Eva Tuyishime", "Frank Rutayisire", "Grace Kamali", "Henri Bizimana"]

def now():
    return datetime.now().isoformat()

def seed_branches():
    print("\n📍 Seeding branches...")
    # Check which branches already exist
    existing = db.table("branches").select("name").execute().data
    existing_names = {r["name"] for r in existing}

    inserted = 0
    for b in BRANCHES:
        if b["name"] in existing_names:
            print(f"   ⏭  {b['name']} (already exists)")
            continue
        rec = {**b, "id": str(uuid.uuid4()), "is_active": True, "created_at": now()}
        try:
            db.table("branches").insert(rec).execute()
            print(f"   ✅ {b['name']}")
            inserted += 1
        except Exception as e:
            print(f"   ❌ {b['name']}: {e}")

    result = db.table("branches").select("id,name").execute()
    return {r["name"]: r["id"] for r in result.data}


def seed_users(branch_map):
    print("\n👤 Seeding users...")
    existing = {r["email"] for r in db.table("users").select("email").execute().data}
    users = [
        {"email": "admin@abrwanda.com",   "full_name": "Demo Admin",   "role": "admin",   "branch_id": None},
        {"email": "analyst@abrwanda.com", "full_name": "Risk Analyst", "role": "analyst", "branch_id": branch_map.get("Kigali HQ")},
    ]
    for u in users:
        if u["email"] in existing:
            print(f"   ⏭  {u['email']} (already exists)")
            continue
        rec = {**u, "id": str(uuid.uuid4()), "hashed_password": pwd_context.hash("password123"),
               "is_active": True, "created_at": now()}
        try:
            db.table("users").insert(rec).execute()
            print(f"   ✅ {u['email']}")
        except Exception as e:
            print(f"   ❌ {u['email']}: {e}")


def seed_clients(branch_map):
    print("\n👥 Seeding clients (150)...")
    # Check existing client codes
    existing = {r["client_code"] for r in db.table("clients").select("client_code").execute().data}
    branch_ids = list(branch_map.values())
    clients = []
    for i in range(150):
        code = f"ABR{str(i+1).zfill(4)}"
        if code in existing:
            continue
        risk_score = round(max(5, min(99, random.gauss(45, 20))), 1)
        risk_cat = "critical" if risk_score > 80 else "high" if risk_score > 65 else "medium" if risk_score > 40 else "low"
        clients.append({
            "id": str(uuid.uuid4()),
            "full_name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "client_code": code,
            "national_id": f"1{random.randint(1970,2000)}{random.randint(10000000,99999999)}",
            "phone": f"+25078{random.randint(1000000,9999999)}",
            "gender": random.choice(["Male", "Female"]),
            "province": random.choice(["Kigali", "Northern", "Southern", "Eastern", "Western"]),
            "branch_id": random.choice(branch_ids),
            "client_segment": random.choice(["micro", "small", "medium"]),
            "business_type": random.choice(["sole_trader", "partnership", "cooperative"]),
            "registration_date": str(date.today() - timedelta(days=random.randint(60, 1800))),
            "risk_score": risk_score,
            "risk_category": risk_cat,
            "is_active": True,
            "created_at": now(),
            "updated_at": now(),
        })
    if clients:
        try:
            db.table("clients").insert(clients).execute()
            print(f"   ✅ {len(clients)} clients seeded")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    else:
        print("   ⏭  All clients already exist")
    return db.table("clients").select("id,client_code,branch_id").execute().data


def seed_loans(client_records, branch_map):
    print("\n💳 Seeding loans (~250)...")
    # Get existing loan numbers to avoid duplicates
    existing = {r["loan_number"] for r in db.table("loans").select("loan_number").execute().data}
    branch_ids = list(branch_map.values())
    loans = []
    # Use a timestamp-based prefix to guarantee uniqueness on re-runs
    prefix = datetime.now().strftime("%m%d%H%M")
    counter = 1
    for client in random.sample(client_records, min(200, len(client_records))):
        num_loans = 2 if random.random() < 0.25 else 1
        for _ in range(num_loans):
            loan_number = f"LN{prefix}{str(counter).zfill(4)}"
            counter += 1
            if loan_number in existing:
                continue
            principal = random.choice([100000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000])
            par_days = 0
            status = "active"
            r = random.random()
            if r < 0.08:
                status = "npl"; par_days = random.randint(90, 365)
            elif r < 0.18:
                par_days = random.randint(31, 89)
            elif r < 0.03:
                status = "written_off"; par_days = random.randint(180, 500)
            outstanding = principal * random.uniform(0.3, 1.0) if status != "written_off" else 0
            disbursed = date.today() - timedelta(days=random.randint(30, 720))
            loans.append({
                "id": str(uuid.uuid4()),
                "loan_number": loan_number,
                "client_id": client["id"],
                "branch_id": client.get("branch_id") or random.choice(branch_ids),
                "loan_officer": random.choice(LOAN_OFFICERS),
                "disbursement_date": str(disbursed),
                "maturity_date": str(disbursed + timedelta(days=random.choice([180, 365, 540]))),
                "principal_amount": float(principal),
                "outstanding_balance": round(outstanding, 2),
                "interest_rate": round(random.uniform(18, 36), 2),
                "term_months": random.choice([6, 12, 18, 24]),
                "status": status,
                "par_days": par_days,
                "days_past_due": par_days,
                "restructured": random.random() < 0.08,
                "restructure_count": random.randint(1, 2) if random.random() < 0.08 else 0,
                "write_off_amount": float(principal) * 0.9 if status == "written_off" else 0.0,
                "sector": random.choice(SECTORS),
                "created_at": now(),
                "updated_at": now(),
            })
    if loans:
        try:
            db.table("loans").insert(loans).execute()
            print(f"   ✅ {len(loans)} loans seeded")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    else:
        print("   ⏭  No new loans to seed")
    return db.table("loans").select("id,client_id,branch_id").execute().data


def seed_payments(loan_records):
    print("\n💰 Seeding payments...")
    payments = []
    for loan in random.sample(loan_records, min(100, len(loan_records))):
        for _ in range(random.randint(2, 8)):
            pd_date = date.today() - timedelta(days=random.randint(1, 400))
            amount_due = random.randint(10000, 80000)
            is_late = random.random() < 0.2
            payments.append({
                "id": str(uuid.uuid4()),
                "loan_id": loan["id"],
                "client_id": loan.get("client_id"),
                "branch_id": loan.get("branch_id"),
                "payment_date": str(pd_date),
                "scheduled_date": str(pd_date - timedelta(days=random.randint(0, 10))),
                "amount_due": float(amount_due),
                "amount_paid": float(int(amount_due * random.uniform(0.8, 1.1))),
                "principal_paid": float(int(amount_due * 0.6)),
                "interest_paid": float(int(amount_due * 0.4)),
                "penalty_paid": float(random.randint(0, 2000)),
                "payment_method": random.choice(["cash", "mobile_money", "bank_transfer"]),
                "is_late": is_late,
                "days_late": random.randint(1, 30) if is_late else 0,
                "created_at": now(),
            })
    try:
        db.table("payments").insert(payments).execute()
        print(f"   ✅ {len(payments)} payments seeded")
    except Exception as e:
        print(f"   ❌ Error: {e}")


def seed_snapshots(branch_map):
    print("\n📊 Seeding portfolio snapshots...")
    # Check if snapshots already exist
    existing_count = len(db.table("portfolio_snapshots").select("id").execute().data)
    if existing_count > 0:
        print(f"   ⏭  {existing_count} snapshots already exist, skipping")
        return
    snapshots = []
    today = date.today()
    for months_back in range(12):
        snap_date = today - timedelta(days=months_back * 30)
        glp = random.randint(3_000_000_000, 6_000_000_000)
        snapshots.append({
            "id": str(uuid.uuid4()), "snapshot_date": str(snap_date), "branch_id": None,
            "gross_loan_portfolio": float(glp), "active_loans": random.randint(2500, 4000),
            "active_clients": random.randint(2000, 3500),
            "disbursements": float(random.randint(200_000_000, 600_000_000)),
            "par_30": round(random.uniform(4, 12), 2), "par_60": round(random.uniform(2, 7), 2),
            "par_90": round(random.uniform(1, 5), 2), "npl_ratio": round(random.uniform(1.5, 6), 2),
            "write_offs": float(random.randint(10_000_000, 80_000_000)),
            "restructured_loans_pct": round(random.uniform(3, 12), 2),
            "repeat_borrower_rate": round(random.uniform(40, 70), 2),
            "avg_loan_size": float(random.randint(300_000, 1_500_000)),
            "collection_rate": round(random.uniform(85, 98), 2), "created_at": now(),
        })
        for bname, bid in list(branch_map.items())[:5]:
            snapshots.append({
                "id": str(uuid.uuid4()), "snapshot_date": str(snap_date), "branch_id": bid,
                "gross_loan_portfolio": float(glp // 10), "active_loans": random.randint(200, 500),
                "active_clients": random.randint(150, 400),
                "par_30": round(random.uniform(3, 15), 2), "npl_ratio": round(random.uniform(1, 7), 2),
                "collection_rate": round(random.uniform(82, 98), 2), "created_at": now(),
            })
    try:
        db.table("portfolio_snapshots").insert(snapshots).execute()
        print(f"   ✅ {len(snapshots)} snapshots seeded")
    except Exception as e:
        print(f"   ❌ Error: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("AB Rwanda Full Seed")
    print("=" * 60)
    branch_map = seed_branches()
    seed_users(branch_map)
    client_records = seed_clients(branch_map)
    loan_records = seed_loans(client_records, branch_map)
    seed_payments(loan_records)
    seed_snapshots(branch_map)
    print("\n✅ All done!")
