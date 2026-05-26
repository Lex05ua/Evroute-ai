from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "EVRoute AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    #JWT
    SECRET_KEY: str = "change-this-secret-key-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./evroute.db"

    #APIs
    OPENCHARGEMAP_API_KEY: str = ""
    OPENROUTESERVICE_API_KEY: str = ""
    GROQ_API_KEY: str = ""


    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
