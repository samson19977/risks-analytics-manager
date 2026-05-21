from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from config import get_supabase, get_settings

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

def create_token(data: dict) -> str:
    settings = get_settings()
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login")
async def login(req: LoginRequest):
    db = get_supabase()
    result = db.table("users").select("*").eq("email", req.email).eq("is_active", True).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = result.data[0]
    if not pwd_context.verify(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    db.table("users").update({"last_login": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    token = create_token({"sub": user["id"], "email": user["email"], "role": user["role"], "name": user["full_name"]})
    return {"access_token": token, "token_type": "bearer", "user": {
        "id": user["id"], "email": user["email"],
        "full_name": user["full_name"], "role": user["role"],
    }}

@router.get("/me")
async def me(token_data: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("users").select("id,email,full_name,role,branch_id,last_login").eq("id", token_data["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]
