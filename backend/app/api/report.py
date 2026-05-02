from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
from app.db.deps import get_db
from app.schemas.report import SoapReport, SoapReportCreate, SoapReportUpdate
from app.core.deps import get_current_user
from app.services.report_service import ReportService
from app.core.roles import require_role
from app.models.report import Report

router = APIRouter()

@router.post("", response_model=SoapReport)
def create_report(
    data: SoapReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return ReportService.create_report(
        db, data, current_user.user_id, current_user.organization_id
    )

@router.get("", response_model=List[SoapReport])
def list_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Report).filter(
        Report.organization_id == current_user.organization_id
    ).order_by(Report.created_at.desc()).all()

@router.get("/{report_id}")
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/consultation/{consultation_id}", response_model=SoapReport)
def get_report_by_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = ReportService.get_report_by_consultation(
        db, consultation_id, current_user.organization_id
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.put("/{report_id}", response_model=SoapReport)
def update_report(
    report_id: str,
    data: SoapReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = ReportService.update_report(db, report_id, data, current_user.organization_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.post("/{report_id}/finalize")
def finalize_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = ReportService.finalize_report(
        db, report_id, current_user.user_id, current_user.organization_id
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.post("/{report_id}/approve")
def approve_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "supervisor"])
    )
):
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "approved"
    report.approved_by = current_user.user_id
    report.approved_at = datetime.now(timezone.utc)

    db.commit()

    return {"message": "Report approved"}

@router.post("/{report_id}/sign")
def sign_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "signed"

    db.commit()

    return {"message": "Report signed"}

@router.post("/{report_id}/archive")
def archive_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin"])
    )
):
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "archived"

    db.commit()

    return {"message": "Report archived"}

@router.post("/{report_id}/export")
def export_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Returns report data for frontend export."""
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "report_id": report.report_id,
        "subjective": report.subjective,
        "objective": report.objective,
        "assessment": report.assessment,
        "plan": report.plan,
        "medications": report.medications,
        "status": report.status,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "download_url": "#", # Simulated
        "file_name": f"SOAP_Report_{report_id[:8]}.pdf"
    }