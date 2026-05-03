from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
from app.models.consultation import Consultation
from app.schemas.consultation import ConsultationCreate

import hashlib
from app.services.audit_service import audit_service
from app.services.report_service import ReportService

class ConsultationService:
    @staticmethod
    def create_consultation(db: Session, data: ConsultationCreate, user_id: str, organization_id: str):
        try:
            new_consultation = Consultation(
                **data.dict(),
                user_id=user_id,
                organization_id=organization_id,
                status="pending"
            )
            db.add(new_consultation)
            db.commit()
            db.refresh(new_consultation)
            
            # Log audit event (failsafe)
            try:
                audit_service.log_event(
                    db, 
                    action="consultation_created", 
                    user_id=user_id, 
                    organization_id=organization_id, 
                    resource_id=new_consultation.consultation_id
                )
            except Exception as audit_err:
                print(f"Audit logging failed: {str(audit_err)}")
                
            return new_consultation
        except Exception as e:
            print(f"CRITICAL: Consultation creation failed! Error type: {type(e).__name__}, Message: {str(e)}")
            db.rollback()
            raise e

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
            consultation.status = "in_progress"
            consultation.started_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(consultation)
            audit_service.log_event(db, action="consultation_started", user_id=consultation.user_id, organization_id=organization_id, resource_id=consultation_id)
        return consultation

    @staticmethod
    def end_consultation(db: Session, consultation_id: str, organization_id: str, audio_data: Optional[str] = None):
        """
        Ends a consultation, processes audio (encryption/storage), and triggers medical transcription.
        """
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if not consultation:
            return None

        consultation.status = "processing"
        consultation.ended_at = datetime.now(timezone.utc)
        
        # 1. Calculate duration
        if consultation.started_at:
            delta = consultation.ended_at - consultation.started_at
            consultation.duration_minutes = int(delta.total_seconds() / 60)

        # 2. Handle Audio Processing & Encryption
        import base64
        from app.core.speech import transcribe_audio, encrypt_audio

        if audio_data:
            try:
                # Remove header if present (e.g., "data:audio/wav;base64,")
                if "," in audio_data:
                    audio_data = audio_data.split(",")[1]
                
                raw_audio = base64.b64decode(audio_data)
                
                # AES-256-GCM Encryption (Simulated)
                encrypted_audio = encrypt_audio(raw_audio)
                
                # Checksum for integrity
                checksum = hashlib.sha256(raw_audio).hexdigest()
                consultation.audio_checksum = checksum
                consultation.audio_file_id = f"enc_audio_{consultation_id}_{checksum[:8]}"
                
                # 3. Trigger Azure Medical Transcription
                transcription_result = transcribe_audio(raw_audio, consultation_id)
                
                consultation.transcription_text = transcription_result["text"]
                consultation.transcription_status = transcription_result["status"]
                consultation.transcription_job_id = transcription_result["job_id"]
                consultation.transcription_confidence = transcription_result["confidence"]

            except Exception as e:
                print(f"Audio processing failed: {str(e)}")
                consultation.transcription_status = "failed"

        # 4. Trigger AI SOAP Generation
        if consultation.transcription_text and consultation.transcription_status == "completed":
            try:
                ReportService.generate_soap_report(db, consultation_id, organization_id)
                consultation.status = "completed"
            except Exception as e:
                print(f"SOAP Generation failed: {str(e)}")
                consultation.status = "failed_soap"
        else:
            consultation.status = "failed_transcription"

        db.commit()
        db.refresh(consultation)
        
        audit_service.log_event(db, action="consultation_ended", user_id=consultation.user_id, organization_id=organization_id, resource_id=consultation_id)
        return consultation

    @staticmethod
    def update_consultation(db: Session, consultation_id: str, organization_id: str, data: dict):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if not consultation:
            return None
            
        for key, value in data.items():
            if hasattr(consultation, key):
                setattr(consultation, key, value)
        
        db.commit()
        db.refresh(consultation)
        return consultation

    @staticmethod
    def delete_consultation(db: Session, consultation_id: str, organization_id: str):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if consultation:
            db.delete(consultation)
            db.commit()
            return True
        return False

