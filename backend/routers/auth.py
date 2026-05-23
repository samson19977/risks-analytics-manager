from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
from config import get_supabase, get_settings
import base64, json

router = APIRouter()
security = HTTPBearer()

# Demo users — matches the frontend Next.js API route
DEMO_USERS = [
    {"id": "demo-admin-001",   "email": "admin@abrwanda.rw",    "full_name": "Admin User",        "role": "admin"},
    {"id": "demo-admin-002",   "email": "admin@abrwanda.com",   "full_name": "Admin User",        "role": "admin"},
    {"id": "demo-risk-001",    "email": "risk@abrwanda.com",    "full_name": "Risk Manager",      "role": "risk_manager"},
    {"id": "demo-analyst-001", "email": "analyst@abrwanda.com", "full_name": "Portfolio Analyst", "role": "analyst"},
    {"id": "demo-branch-001",  "email": "branch@abrwanda.com",  "full_name": "Branch Manager",    "role": "branch_manager"},
    {"id": "demo-viewer-001",  "email": "viewer@abrwanda.com",  "full_name": "Executive Viewer",  "role": "viewer"},
]

class LoginRequest(BaseModel):
    email: str

def create_token(data: dict) -> str:
    settings = get_settings()
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials

    # Accept demo tokens issued by the Next.js API route
    if token.startswith("demo."):
        try:
            payload = json.loads(base64.b64decode(token[5:]).decode())
            if payload.get("exp", 0) < datetime.utcnow().timestamp() * 1000:
                raise HTTPException(status_code=401, detail="Token expired")
            return payload
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid demo token")

    # Accept real JWT tokens (for when backend is running with Supabase)
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login")
async def login(req: LoginRequest):
    # Find user in demo list (no password required)
    user = next((u for u in DEMO_USERS if u["email"].lower() == req.email.strip().lower()), None)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    token = create_token({"sub": user["id"], "email": user["email"], "role": user["role"], "name": user["full_name"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]},
    }

@router.get("/me")
async def me(token_data: dict = Depends(verify_token)):
    # For demo tokens, return payload directly without hitting Supabase
    if token_data.get("sub", "").startswith("demo-"):
        return {
            "id": token_data["sub"],
            "email": token_data["email"],
            "full_name": token_data.get("name", ""),
            "role": token_data["role"],
        }
    # For real tokens, fetch from Supabase
    try:
        db = get_supabase()
        result = db.table("users").select("id,email,full_name,role,branch_id,last_login").eq("id", token_data["sub"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        return result.data[0]
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
