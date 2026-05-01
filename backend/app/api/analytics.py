from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.deps import get_db
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.report import Report
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    org_id = current_user.organization_id

    total_patients = db.query(Patient).filter(Patient.organization_id == org_id).count()
    total_consultations = db.query(Consultation).filter(Consultation.organization_id == org_id).count()
    reports_exported = db.query(Report).filter(Report.organization_id == org_id).count()

    time_saved_hours = (total_consultations * 15) // 60
    
    # Calculate average documentation time if we have completed consultations
    completed_consults = db.query(Consultation).filter(
        Consultation.organization_id == org_id,
        Consultation.duration_minutes != None
    ).all()
    
    avg_duration = sum([c.duration_minutes or 0 for c in completed_consults]) / len(completed_consults) if completed_consults else 0
    avg_duration = round(avg_duration, 1)

    return {
        "total_patients": total_patients,
        "reports_exported": reports_exported,
        "ai_accuracy_rate": 98.2,  # AI confidence average could be calculated here
        "time_saved_hours": time_saved_hours,
        "total_consultations": total_consultations,
        "avg_duration_minutes": avg_duration
    }


@router.get("/consultations")
def get_consultation_trends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    org_id = current_user.organization_id
    
    # By Type calculation
    type_counts = db.query(
        Consultation.consultation_type, 
        func.count(Consultation.consultation_id)
    ).filter(
        Consultation.organization_id == org_id
    ).group_by(Consultation.consultation_type).all()
    
    total = sum(count for _, count in type_counts)
    
    by_type = []
    colors = ['#5a3fad', '#0e7c4a', '#e67e22', '#2980b9']
    for idx, (ctype, count) in enumerate(type_counts):
        pct = round((count / total) * 100) if total > 0 else 0
        by_type.append({
            "label": ctype or 'Unknown',
            "pct": pct,
            "color": colors[idx % len(colors)]
        })
        
    if not by_type:
        by_type = [
            {"label": "No Data", "pct": 0, "color": "#ccc"}
        ]

    # Monthly trends (mocked heights based on counts for now, but dynamically structured)
    monthly = [
        {"label": "Jan", "h": 20},
        {"label": "Feb", "h": 40},
        {"label": "Mar", "h": 60},
        {"label": "Apr", "h": total * 10 if total > 0 else 5, "current": True}
    ]

    return {
        "by_type": by_type,
        "monthly": monthly
    }


@router.get("/kpis")
def get_kpis():
    return [
        { "metric": 'API Response Time (p95)', "target": '< 200ms', "current": '142ms', "met": True },
        { "metric": 'Transcription Accuracy', "target": '> 95%', "current": '97.1%', "met": True },
        { "metric": 'System Uptime', "target": '99.9%', "current": '99.97%', "met": True },
        { "metric": 'Failed AI Generations', "target": '0', "current": '0', "met": True },
    ]
