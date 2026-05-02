from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediScribe"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "supersecretkeythatisverylongandsecure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "sqlite:///./mediscribe.db"
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    AZURE_SPEECH_KEY: Optional[str] = None
    AZURE_SPEECH_REGION: Optional[str] = "eastus"
    ENDPOINT: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
