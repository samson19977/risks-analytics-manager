"""
AB Rwanda Risk Analytics Platform v3 - Seed Data
Run: python seed.py
"""
import random
import uuid
from datetime import date, timedelta, datetime
from supabase import create_client
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BRANCHES = [
    {"id": str(uuid.uuid4()), "name": "Kigali HQ", "province": "Kigali", "district": "Nyarugenge", "manager_name": "Jean Pierre Habimana"},
    {"id": str(uuid.uuid4()), "name": "Musanze Branch", "province": "Northern", "district": "Musanze", "manager_name": "Marie Claire Uwimana"},
    {"id": str(uuid.uuid4()), "name": "Nyagatare Branch", "province": "Eastern", "district": "Nyagatare", "manager_name": "Emmanuel Ndayambaje"},
    {"id": str(uuid.uuid4()), "name": "Huye Branch", "province": "Southern", "district": "Huye", "manager_name": "Alphonsine Mukamana"},
    {"id": str(uuid.uuid4()), "name": "Rubavu Branch", "province": "Western", "district": "Rubavu", "manager_name": "Patrick Nzeyimana"},
    {"id": str(uuid.uuid4()), "name": "Muhanga Branch", "province": "Southern", "district": "Muhanga", "manager_name": "Solange Ingabire"},
]

PRODUCTS = [
    {"id": str(uuid.uuid4()), "name": "Micro Business Loan", "code": "MBL", "min_amount": 100000, "max_amount": 2000000, "min_term_months": 6, "max_term_months": 24, "interest_rate": 18.0},
    {"id": str(uuid.uuid4()), "name": "Agricultural Loan", "code": "AGL", "min_amount": 200000, "max_amount": 5000000, "min_term_months": 6, "max_term_months": 36, "interest_rate": 16.0},
    {"id": str(uuid.uuid4()), "name": "SME Loan", "code": "SME", "min_amount": 1000000, "max_amount": 50000000, "min_term_months": 12, "max_term_months": 60, "interest_rate": 20.0},
    {"id": str(uuid.uuid4()), "name": "Transport Loan", "code": "TRL", "min_amount": 500000, "max_amount": 10000000, "min_term_months": 12, "max_term_months": 48, "interest_rate": 22.0},
    {"id": str(uuid.uuid4()), "name": "Housing Improvement Loan", "code": "HIL", "min_amount": 500000, "max_amount": 15000000, "min_term_months": 24, "max_term_months": 84, "interest_rate": 17.0},
]

FIRST_NAMES = ["Jean", "Marie", "Emmanuel", "Alice", "Patrick", "Solange", "Eric", "Grace", "Peter", "Diane",
               "Claude", "Chantal", "Joseph", "Vestine", "Innocent", "Olive", "Frederic", "Ange", "Desire", "Nadine",
               "Celestin", "Joselyne", "Theogene", "Clarisse", "Alexis", "Faustine", "Lionel", "Bernadette", "Sylvain", "Odette"]
LAST_NAMES = ["Habimana", "Uwimana", "Ndayambaje", "Mukamana", "Nzeyimana", "Ingabire", "Nsanzimana", "Uwase",
              "Niyonzima", "Mutesi", "Bizimana", "Uwitonze", "Nshimiyimana", "Kayitesi", "Rugamba", "Iradukunda",
              "Ntirenganya", "Uwera", "Hakizimana", "Cyubahiro"]
SECTORS = ["trade", "agriculture", "transport", "manufacturing", "services", "construction", "education"]
SEGMENTS = ["micro", "sme", "agriculture", "transport"]
LOAN_OFFICERS = ["LO001", "LO002", "LO003", "LO004", "LO005", "LO006", "LO007", "LO008"]

def random_date(start_days_ago=730, end_days_ago=30):
    start = date.today() - timedelta(days=start_days_ago)
    end = date.today() - timedelta(days=end_days_ago)
    return start + timedelta(days=random.randint(0, max(1, (end - start).days)))

def seed_all():
    print("=" * 60)
    print("AB Rwanda Risk Analytics Platform v3 - Seed Data")
    print("=" * 60)

    # Branches
    print("\nSeeding branches...")
    for b in BRANCHES:
        try: supabase.table("branches").upsert(b).execute()
        except Exception as e: print(f"  {e}")
    print(f"  {len(BRANCHES)} branches seeded")

    # Products
    print("Seeding loan products...")
    for p in PRODUCTS:
        try: supabase.table("loan_products").upsert(p).execute()
        except Exception as e: print(f"  {e}")

    # Users
    print("Seeding users...")
    users = [
        {"id": str(uuid.uuid4()), "email": "samson@abrwanda.com", "full_name": "Samson Niyizurugero", "hashed_password": pwd_context.hash("Admin@2024"), "role": "admin"},
        {"id": str(uuid.uuid4()), "email": "risk@abrwanda.com", "full_name": "Risk Manager", "hashed_password": pwd_context.hash("Risk@2024"), "role": "risk_manager"},
        {"id": str(uuid.uuid4()), "email": "analyst@abrwanda.com", "full_name": "Portfolio Analyst", "hashed_password": pwd_context.hash("Analyst@2024"), "role": "analyst"},
        {"id": str(uuid.uuid4()), "email": "branch@abrwanda.com", "full_name": "Branch Manager Demo", "hashed_password": pwd_context.hash("Branch@2024"), "role": "branch_manager"},
        {"id": str(uuid.uuid4()), "email": "viewer@abrwanda.com", "full_name": "Executive Viewer", "hashed_password": pwd_context.hash("Viewer@2024"), "role": "viewer"},
    ]
    for u in users:
        try: supabase.table("users").upsert(u).execute()
        except Exception as e: print(f"  {e}")

    # Clients
    print("Seeding 600 clients...")
    clients = []
    for i in range(600):
        branch = random.choice(BRANCHES)
        par_days = random.choices([0, 15, 45, 90, 180], weights=[55, 15, 15, 10, 5])[0]
        risk = 20 + par_days * 0.4 + random.uniform(-5, 5)
        risk = max(10, min(99, risk))
        risk_cat = "low" if risk < 40 else "medium" if risk < 65 else "high" if risk < 80 else "critical"
        clients.append({
            "id": str(uuid.uuid4()),
            "client_code": f"ABR{str(i+1001).zfill(5)}",
            "full_name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "national_id": f"1{random.randint(19700101,20001231)}1{random.randint(10000000,99999999)}",
            "phone": f"+2507{random.randint(20000000,99999999)}",
            "gender": random.choice(["M", "F"]),
            "date_of_birth": str(date(random.randint(1965, 2000), random.randint(1,12), random.randint(1,28))),
            "province": branch["province"],
            "district": branch["district"],
            "sector": random.choice(SECTORS),
            "branch_id": branch["id"],
            "client_segment": random.choice(SEGMENTS),
            "business_type": random.choice(["retail_trade", "food_processing", "agriculture", "motorcycle_taxi", "salon", "construction", "tailoring"]),
            "registration_date": str(random_date(1460, 30)),
            "risk_score": round(risk, 2),
            "risk_category": risk_cat,
            "is_active": True,
        })
    for i in range(0, len(clients), 50):
        try: supabase.table("clients").upsert(clients[i:i+50]).execute()
        except Exception as e: print(f"  Batch {i}: {e}")
    print(f"  {len(clients)} clients seeded")

    ## Loans
    print("Seeding loans...")
    loans = []
    used_numbers = set()
    for client in clients:
        num_loans = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
        for _ in range(num_loans):
            product = random.choice(PRODUCTS)
            disburse_date = random_date(720, 60)
            term = random.randint(product["min_term_months"], product["max_term_months"])
            maturity = disburse_date + timedelta(days=term*30)
            principal = round(random.uniform(product["min_amount"], min(product["max_amount"], product["max_amount"]*0.3)), -3)
            par_days = random.choices([0, 15, 45, 90, 180, 360], weights=[50, 15, 15, 10, 7, 3])[0]
            outstanding = round(principal * random.uniform(0.1, 0.9), -3)
            status = "active"
            if par_days > 270: status = random.choice(["npl", "written_off"])
            elif par_days > 0 and random.random() < 0.18: status = "restructured"
            ln = f"LN{random.randint(100000,999999)}"
            while ln in used_numbers:
                ln = f"LN{random.randint(100000,999999)}"
            used_numbers.add(ln)
            loans.append({
                "id": str(uuid.uuid4()),
                "loan_number": ln,
                "client_id": client["id"],
                "branch_id": client["branch_id"],
                "product_id": product["id"],
                "loan_officer": random.choice(LOAN_OFFICERS),
                "disbursement_date": str(disburse_date),
                "maturity_date": str(maturity),
                "principal_amount": principal,
                "outstanding_balance": outstanding,
                "interest_rate": product["interest_rate"],
                "term_months": term,
                "status": status,
                "par_days": par_days,
                "days_past_due": par_days,
                "restructured": status == "restructured",
                "restructure_count": 1 if status == "restructured" else 0,
                "write_off_amount": outstanding if status == "written_off" else 0,
                "sector": client["sector"],
            })
    for i in range(0, len(loans), 50):
        try: supabase.table("loans").upsert(loans[i:i+50]).execute()
        except Exception as e: print(f"  Loan batch {i}: {e}")
    print(f"  {len(loans)} loans seeded")

    # Payments
    print("Seeding payments...")
    payments = []
    for loan in random.sample(loans, min(len(loans), 700)):
        n_payments = random.randint(2, 12)
        for j in range(n_payments):
            scheduled = date.fromisoformat(loan["disbursement_date"]) + timedelta(days=30*(j+1))
            days_late = random.choices([0, 5, 15, 45], weights=[65, 15, 12, 8])[0]
            pay_date = scheduled + timedelta(days=days_late)
            amount_due = round(loan["principal_amount"] / loan["term_months"] * 1.015, 2)
            amount_paid = amount_due if days_late == 0 else round(amount_due * random.uniform(0.7, 1.0), 2)
            payments.append({
                "id": str(uuid.uuid4()),
                "loan_id": loan["id"],
                "client_id": loan["client_id"],
                "branch_id": loan["branch_id"],
                "payment_date": str(pay_date),
                "scheduled_date": str(scheduled),
                "amount_due": amount_due,
                "amount_paid": amount_paid,
                "principal_paid": round(amount_paid * 0.75, 2),
                "interest_paid": round(amount_paid * 0.25, 2),
                "penalty_paid": round(random.uniform(0, 5000) if days_late > 0 else 0, 2),
                "payment_method": random.choice(["cash", "mobile_money", "mobile_money", "bank_transfer"]),
                "is_late": days_late > 0,
                "days_late": days_late,
                "reference": f"REF{random.randint(1000000,9999999)}",
                "recorded_by": random.choice(LOAN_OFFICERS),
            })
    for i in range(0, len(payments), 100):
        try: supabase.table("payments").upsert(payments[i:i+100]).execute()
        except Exception as e: print(f"  Payment batch {i}: {e}")
    print(f"  {len(payments)} payments seeded")

    # Portfolio Snapshots (9 months trending deterioration matching assessment)
    print("Seeding portfolio snapshots...")
    snapshots = []
    base_date = date.today() - timedelta(days=270)
    for month_offset in range(9):
        snap_date = base_date + timedelta(days=30*month_offset)
        par_trend = 4.9 + (month_offset * 0.65)
        npl_trend = 3.1 + (month_offset * 0.48)
        write_off_trend = 110_000_000 + (month_offset * 25_000_000) + (month_offset**2 * 2_000_000)
        repeat_trend = max(47, 62 - month_offset * 1.6)
        avg_loan_growth = 5 + month_offset * 1.5
        glp_growth = 1 + (0.08 + (month_offset//3)*0.025)

        for branch in BRANCHES:
            bf = random.uniform(0.85, 1.15)
            snapshots.append({
                "id": str(uuid.uuid4()),
                "snapshot_date": str(snap_date),
                "branch_id": branch["id"],
                "sector": None,
                "gross_loan_portfolio": round(random.uniform(800_000_000, 3_000_000_000) * glp_growth * bf, -3),
                "active_loans": random.randint(200, 800),
                "active_clients": random.randint(180, 750),
                "disbursements": round(random.uniform(50_000_000, 400_000_000) * glp_growth, -3),
                "par_30": round(par_trend * bf + random.uniform(-1, 1.5), 2),
                "par_60": round((par_trend - 2) * bf + random.uniform(-0.5, 1), 2),
                "par_90": round((par_trend - 3.5) * bf + random.uniform(-0.3, 0.8), 2),
                "npl_ratio": round(npl_trend * bf + random.uniform(-0.5, 0.5), 2),
                "write_offs": round(write_off_trend * bf * random.uniform(0.8, 1.2), -3),
                "restructured_loans_pct": round(3.0 + month_offset * 0.9 + random.uniform(-0.3, 0.5), 2),
                "repeat_borrower_rate": round(repeat_trend + random.uniform(-2, 2), 1),
                "avg_loan_size": round(500_000 * (1 + avg_loan_growth/100 * month_offset), -3),
                "collection_rate": round(96 - month_offset * 0.6 + random.uniform(-1, 1), 2),
            })
        # Also add a null-branch aggregate row
        snapshots.append({
            "id": str(uuid.uuid4()),
            "snapshot_date": str(snap_date),
            "branch_id": None,
            "sector": None,
            "gross_loan_portfolio": round(random.uniform(8_000_000_000, 15_000_000_000) * glp_growth, -3),
            "active_loans": random.randint(1500, 3000),
            "active_clients": random.randint(1400, 2800),
            "disbursements": round(random.uniform(500_000_000, 2_000_000_000) * glp_growth, -3),
            "par_30": round(par_trend + random.uniform(-0.5, 0.5), 2),
            "par_60": round((par_trend - 2) + random.uniform(-0.3, 0.3), 2),
            "par_90": round((par_trend - 3.5) + random.uniform(-0.2, 0.2), 2),
            "npl_ratio": round(npl_trend + random.uniform(-0.3, 0.3), 2),
            "write_offs": round(write_off_trend * random.uniform(0.95, 1.05), -3),
            "restructured_loans_pct": round(3.0 + month_offset * 0.9, 2),
            "repeat_borrower_rate": round(repeat_trend, 1),
            "avg_loan_size": round(500_000 * (1 + avg_loan_growth/100 * month_offset), -3),
            "collection_rate": round(96 - month_offset * 0.6, 2),
        })
    for i in range(0, len(snapshots), 50):
        try: supabase.table("portfolio_snapshots").upsert(snapshots[i:i+50]).execute()
        except Exception as e: print(f"  Snapshot batch {i}: {e}")
    print(f"  {len(snapshots)} snapshots seeded")

    # Risk Alerts
    print("Seeding risk alerts...")
    alert_types = [
        ("par_spike", "critical", "PAR>30 Spike Detected", "PAR>30 exceeded 12% threshold"),
        ("concentration_risk", "high", "Sector Concentration Warning", "Agriculture exceeds 35% of portfolio"),
        ("fraud_suspected", "critical", "Suspicious Transaction Pattern", "Unusual month-end disbursement spike"),
        ("multiple_loans", "high", "Multi-Institution Borrowing Alert", "Client with loans from 4+ institutions identified"),
        ("repeat_borrower_decline", "medium", "Repeat Borrower Rate Declining", "Rate dropped below 50% — client retention risk"),
        ("npl_threshold", "high", "NPL Ratio Breach", "NPL ratio exceeded 7% regulatory warning threshold"),
        ("write_off_increase", "high", "Write-Off Volume Spike", "Write-offs increased 89% quarter-over-quarter"),
        ("loan_officer_risk", "medium", "Loan Officer Portfolio Concern", "Officer portfolio PAR exceeds 15%"),
    ]
    alerts = []
    for branch in BRANCHES:
        for atype, severity, title, desc in random.sample(alert_types, random.randint(2, 5)):
            alerts.append({
                "id": str(uuid.uuid4()),
                "alert_type": atype,
                "severity": severity,
                "title": title,
                "description": f"{desc} — {branch['name']}",
                "branch_id": branch["id"],
                "is_resolved": random.random() < 0.3,
            })
    try: supabase.table("risk_alerts").upsert(alerts).execute()
    except Exception as e: print(f"  {e}")
    print(f"  {len(alerts)} alerts seeded")

    # Fraud Signals
    print("Seeding fraud signals...")
    fraud_signals = []
    for branch in BRANCHES[:3]:
        for _ in range(random.randint(2, 5)):
            fraud_signals.append({
                "id": str(uuid.uuid4()),
                "signal_type": random.choice(["month_end_disbursement_spike", "multiple_active_loans", "high_restructuring_rate", "payment_date_clustering"]),
                "severity": random.choice(["critical", "high", "medium"]),
                "description": f"Auto-detected anomaly at {branch['name']} — requires investigation",
                "branch_id": branch["id"],
                "loan_officer": random.choice(LOAN_OFFICERS),
                "is_investigated": random.random() < 0.2,
            })
    for s in fraud_signals:
        try: supabase.table("fraud_signals").upsert(s).execute()
        except Exception as e: print(f"  {e}")
    print(f"  {len(fraud_signals)} fraud signals seeded")

    print("\n✅ All data seeded successfully!")
    print("\n📋 Demo Login Credentials:")
    print("  Admin:        samson@abrwanda.com  / Admin@2024")
    print("  Risk Manager: risk@abrwanda.com    / Risk@2024")
    print("  Analyst:      analyst@abrwanda.com / Analyst@2024")
    print("  Branch Mgr:   branch@abrwanda.com  / Branch@2024")
    print("  Viewer:       viewer@abrwanda.com  / Viewer@2024")

if __name__ == "__main__":
    seed_all()
