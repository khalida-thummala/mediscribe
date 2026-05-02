from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.db.base import Base
from app.db.session import engine

# models
from app.models.user import User
from app.models.organization import Organization
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.report import Report
from app.models.analysis import Analysis

# routers
from app.api.auth import router as auth_router
from app.api.patient import router as patient_router
from app.api.consultation import router as consultation_router
from app.api.report import router as report_router
from app.api.analysis import router as analysis_router
from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router
from app.api.speech import router as speech_router

app = FastAPI(
    title="MediScribe API",
    description="Production-grade healthcare documentation platform",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all database tables
Base.metadata.create_all(bind=engine)

api_v1 = APIRouter(prefix="/api/v1")

api_v1.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_v1.include_router(patient_router, prefix="/patients", tags=["Patients"])
api_v1.include_router(consultation_router, prefix="/consultations", tags=["Consultations"])
api_v1.include_router(speech_router, prefix="/speech", tags=["Speech"])
api_v1.include_router(report_router, prefix="/reports", tags=["Reports"])
api_v1.include_router(analysis_router, prefix="/ai-analysis", tags=["AI Analysis"])
api_v1.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_v1.include_router(audit_router, prefix="/audit", tags=["Audit Logs"])

app.include_router(api_v1)

@app.get("/")
def read_root():
    return {"message": "MediScribe Backend API is running.", "docs": "/docs"}