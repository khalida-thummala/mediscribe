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
    @staticmethod
    def generate_soap_report(db: Session, consultation_id: str, organization_id: str):
        """
        Uses OpenAI GPT-4 to generate a structured SOAP report from transcription.
        """
        from app.models.consultation import Consultation
        from app.core.config import settings
        import openai

        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()

        if not consultation or not consultation.transcription_text:
            return None

        # Call OpenAI
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = """
        You are a professional medical scribe. Convert the following clinical consultation transcription into a structured SOAP note.
        Return the result in JSON format with keys: "subjective", "objective", "assessment", "plan".
        Maintain medical accuracy and professional terminology.
        """
        
        user_prompt = f"Transcription: {consultation.transcription_text}"
        
        response = client.chat.completions.create(
            model="gpt-4", # Or your configured model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        import json
        soap_data = json.loads(response.choices[0].message.content)
        
        # Create the report record
        new_report = Report(
            consultation_id=consultation_id,
            user_id=consultation.user_id,
            organization_id=organization_id,
            subjective=soap_data.get("subjective", ""),
            objective=soap_data.get("objective", ""),
            assessment=soap_data.get("assessment", ""),
            plan=soap_data.get("plan", ""),
            status="draft"
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report
