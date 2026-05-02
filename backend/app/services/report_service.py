from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.models.report import Report
from app.schemas.report import SoapReportCreate, SoapReportUpdate

# Alias for clarity
SoapReport = Report

class ReportService:
    @staticmethod
    def create_report(db: Session, data: SoapReportCreate, user_id: str, organization_id: str):
        new_report = Report(
            **data.dict(),
            user_id=user_id,
            organization_id=organization_id,
            status="draft"
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report

    @staticmethod
    def get_report_by_consultation(db: Session, consultation_id: str, organization_id: str):
        return db.query(Report).filter(
            Report.consultation_id == consultation_id,
            Report.organization_id == organization_id
        ).first()

    @staticmethod
    def update_report(db: Session, report_id: str, data: SoapReportUpdate, organization_id: str):
        report = db.query(Report).filter(
            Report.report_id == report_id,
            Report.organization_id == organization_id
        ).first()

        if not report:
            return None

        for key, value in data.dict(exclude_unset=True).items():
            setattr(report, key, value)

        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def finalize_report(db: Session, report_id: str, user_id: str, organization_id: str):
        report = db.query(Report).filter(
            Report.report_id == report_id,
            Report.organization_id == organization_id
        ).first()

        if report:
            report.status = "finalized"
            report.approved_at = datetime.utcnow()
            report.approved_by = user_id
            db.commit()
            db.refresh(report)
        return report
