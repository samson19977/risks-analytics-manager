from pydantic_settings import BaseSettings
from supabase import create_client, Client
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "changeme-secret-key")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

def get_supabase() -> Client:
    settings = get_settings()
    key = settings.supabase_service_key or settings.supabase_key
    return create_client(settings.supabase_url, key)
