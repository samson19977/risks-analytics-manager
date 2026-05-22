"""
AB Rwanda Risk Analytics Platform - Seed Data
Run: python seed_fixed.py
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
# 10 BRANCHES (matching your table schema)
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

def seed_branches_only():
    print("=" * 60)
    print("Seeding Branches Only")
    print("=" * 60)

    print("\n📊 Seeding branches...")
    for b in BRANCHES:
        try:
            supabase.table("branches").upsert(b).execute()
            print(f"   ✅ {b['name']}")
        except Exception as e:
            print(f"   ❌ Error with {b['name']}: {e}")
    
    print(f"\n✅ {len(BRANCHES)} branches seeded successfully!")

if __name__ == "__main__":
    seed_branches_only()
