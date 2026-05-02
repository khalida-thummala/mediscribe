from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.models.consultation import Consultation
from app.schemas.consultation import ConsultationCreate

import hashlib
from app.services.audit_service import audit_service
from app.services.report_service import ReportService

class ConsultationService:
    @staticmethod
    def create_consultation(db: Session, data: ConsultationCreate, user_id: str, organization_id: str):
        new_consultation = Consultation(
            **data.dict(),
            user_id=user_id,
            organization_id=organization_id,
            status="pending"
        )
        db.add(new_consultation)
        db.commit()
        db.refresh(new_consultation)
        
        audit_service.log_event(db, action="consultation_created", user_id=user_id, organization_id=organization_id, resource_id=new_consultation.consultation_id)
        return new_consultation

    @staticmethod
    def get_consultations(db: Session, organization_id: str) -> List[Consultation]:
        return db.query(Consultation).filter(
            Consultation.organization_id == organization_id
        ).order_by(Consultation.created_at.desc()).all()

    @staticmethod
    def get_consultation_by_id(db: Session, consultation_id: str, organization_id: str):
        return db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()

    @staticmethod
    def start_consultation(db: Session, consultation_id: str, organization_id: str):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if consultation:
            consultation.status = "recording"
            consultation.started_at = datetime.utcnow()
            db.commit()
            db.refresh(consultation)
            audit_service.log_event(db, action="consultation_started", user_id=consultation.user_id, organization_id=organization_id, resource_id=consultation_id)
        return consultation

    @staticmethod
    def end_consultation(db: Session, consultation_id: str, organization_id: str, audio_data: Optional[str] = None, transcription: Optional[str] = None):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if not consultation:
            return None

        consultation.status = "processing"
        consultation.ended_at = datetime.utcnow()
        
        # Calculate duration
        if consultation.started_at:
            delta = consultation.ended_at - consultation.started_at
            consultation.duration_minutes = int(delta.total_seconds() / 60)

        # Handle Audio
        if audio_data:
            # 1. Generate Checksum
            checksum = hashlib.sha256(audio_data.encode()).hexdigest()
            consultation.audio_checksum = checksum
            consultation.audio_bitrate = "320kbps" # target
            # In a real app, we would use pydub or ffmpeg to compress and upload to S3 here.
            consultation.audio_file_id = f"audio_{consultation_id}_{checksum[:8]}"
        
        # Handle Transcription
        if transcription:
            consultation.transcription_text = transcription
            consultation.transcription_status = "completed"
            consultation.transcription_confidence = 0.95 # placeholder

        db.commit()
        
        # Trigger SOAP Generation (Phase 4)
        if transcription:
            try:
                ReportService.generate_soap_report(db, consultation_id, organization_id)
                consultation.status = "completed"
                db.commit()
            except Exception as e:
                print(f"SOAP Generation failed: {str(e)}")
                consultation.status = "failed_soap"
                db.commit()

        audit_service.log_event(db, action="consultation_ended", user_id=consultation.user_id, organization_id=organization_id, resource_id=consultation_id)
        return consultation
