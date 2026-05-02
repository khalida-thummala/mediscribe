from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.report import Report

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats(db: Session, organization_id: str):
        # Total Patients
        total_patients = db.query(Patient).filter(
            Patient.organization_id == organization_id,
            Patient.deleted_at == None
        ).count()

        # Total Consultations
        total_consultations = db.query(Consultation).filter(
            Consultation.organization_id == organization_id
        ).count()

        # Consultations this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_consultations = db.query(Consultation).filter(
            Consultation.organization_id == organization_id,
            Consultation.created_at >= start_of_month
        ).count()

        # Pending Reports
        pending_reports = db.query(Report).filter(
            Report.organization_id == organization_id,
            Report.status == "draft"
        ).count()
        
        # Reports Exported (Signed/Approved)
        reports_exported = db.query(Report).filter(
            Report.organization_id == organization_id,
            Report.status.in_(["approved", "signed"])
        ).count()

        # Avg Consultation Duration
        avg_duration = db.query(func.avg(Consultation.duration_minutes)).filter(
            Consultation.organization_id == organization_id,
            Consultation.duration_minutes != None
        ).scalar() or 0

        return {
            "total_patients": total_patients,
            "total_consultations": total_consultations,
            "monthly_consultations": monthly_consultations,
            "pending_reports": pending_reports,
            "reports_exported": reports_exported,
            "avg_duration_minutes": round(float(avg_duration), 1),
            "time_saved_hours": round(total_consultations * 0.25, 1) # Estimated 15 mins saved per consultation
        }

    @staticmethod
    def get_consultation_trends(db: Session, organization_id: str, days: int = 30):
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Daily counts
        daily_results = db.query(
            func.date(Consultation.created_at).label('date'),
            func.count(Consultation.consultation_id).label('count')
        ).filter(
            Consultation.organization_id == organization_id,
            Consultation.created_at >= start_date
        ).group_by(func.date(Consultation.created_at)).all()

        # Consultation by type distribution
        type_results = db.query(
            Consultation.consultation_type,
            func.count(Consultation.consultation_id)
        ).filter(
            Consultation.organization_id == organization_id
        ).group_by(Consultation.consultation_type).all()
        
        total_c = sum(r[1] for r in type_results) or 1
        colors = ["#0d6e6e", "#5a3fad", "#e67e22", "#2980b9", "#27ae60"]
        by_type = [
            {
                "label": r[0].capitalize(),
                "pct": round((r[1] / total_c) * 100, 1),
                "color": colors[i % len(colors)]
            } for i, r in enumerate(type_results)
        ]

        # Monthly volume for the last 6 months
        monthly = []
        for i in range(5, -1, -1):
            target_month = (end_date.month - i - 1) % 12 + 1
            target_year = end_date.year + (end_date.month - i - 1) // 12
            month_name = datetime(target_year, target_month, 1).strftime("%b")
            
            count = db.query(Consultation).filter(
                Consultation.organization_id == organization_id,
                func.extract('month', Consultation.created_at) == target_month,
                func.extract('year', Consultation.created_at) == target_year
            ).count()
            
            monthly.append({
                "label": month_name,
                "h": count * 10, # Scaling for visualization
                "current": i == 0
            })

        return {
            "daily": [{"date": str(r.date), "count": r.count} for r in daily_results],
            "by_type": by_type,
            "monthly": monthly
        }
