from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.models.report import Report
from app.core.deps import get_current_user

router = APIRouter()

@router.post("/{id}/export")
def export_report(
    id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Export a report — returns report data as structured JSON for frontend PDF generation."""
    report = db.query(Report).filter(
        Report.report_id == id,
        Report.organization_id == user.organization_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "report_id": report.report_id,
        "consultation_id": report.consultation_id,
        "subjective": report.subjective,
        "objective": report.objective,
        "assessment": report.assessment,
        "plan": report.plan,
        "medications": report.medications,
        "follow_up_needed": report.follow_up_needed,
        "follow_up_days": report.follow_up_days,
        "status": report.status,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }