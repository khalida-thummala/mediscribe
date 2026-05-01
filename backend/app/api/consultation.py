from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from datetime import datetime, timezone
from app.db.deps import get_db
from app.models.consultation import Consultation
from app.models.report import Report
from app.schemas.consultation import (
    ConsultationCreate,
    AudioMetadata
)
from app.core.deps import get_current_user
from app.core.roles import require_role
from app.core.ai import generate_soap
from app.core.speech import transcribe_audio
import json

router = APIRouter()


# GET CONSULTATIONS
@router.get("")
def list_consultations(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner", "supervisor"])
    ),
    limit: int = 10
):
    consultations = db.query(Consultation).filter(
        Consultation.organization_id == current_user.organization_id
    ).order_by(Consultation.created_at.desc()).limit(limit).all()
    
    return {"data": consultations}

# CREATE CONSULTATION
@router.post("")
def create_consultation(
    data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    consultation = Consultation(
        patient_id=data.patient_id,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        consultation_type=data.consultation_type,
        chief_complaint=data.chief_complaint,
        scheduled_at=data.scheduled_at,
        status="scheduled"
    )

    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return consultation

# GET SINGLE CONSULTATION
@router.get("/{consultation_id}")
def get_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        return {"error": "Consultation not found"}

    return consultation

# GET TRANSCRIPTION
@router.get("/{consultation_id}/transcription")
def get_transcription(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        return {"error": "Consultation not found"}

    return {
        "transcription_text": consultation.transcription_text,
        "transcription_status": consultation.transcription_status,
        "confidence_score": consultation.transcription_confidence
    }

# START CONSULTATION
@router.post("/{consultation_id}/start")
def start_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id
    ).first()

    if not consultation:
        return {"error": "Consultation not found"}

    consultation.status = "in_progress"
    consultation.started_at = datetime.now(timezone.utc)
    consultation.transcription_status = "in_progress"

    db.commit()

    return {"message": "Consultation started"}

# END CONSULTATION
@router.post("/{consultation_id}/end")
def end_consultation(
    consultation_id: str,
    audio: AudioMetadata,
    audio_file_path: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id
    ).first()

    if not consultation:
        return {"error": "Consultation not found"}

    transcript = transcribe_audio(audio_file_path)

    consultation.audio_file_id = audio.audio_file_id
    consultation.audio_duration_seconds = audio.audio_duration_seconds
    consultation.audio_bitrate = audio.audio_bitrate
    consultation.audio_checksum = audio.audio_checksum

    consultation.transcription_text = transcript
    consultation.transcription_status = "completed"
    consultation.transcription_confidence = 95.5

    consultation.notes = transcript
    consultation.status = "completed"
    consultation.ended_at = datetime.now(timezone.utc)

    if consultation.started_at:
        duration = consultation.ended_at - consultation.started_at
        consultation.duration_minutes = int(
            duration.total_seconds() / 60
        )

    db.commit()

    return {
        "message": "Consultation completed",
        "transcription": transcript
    }


@router.post("/{consultation_id}/generate-soap")
def generate_soap_endpoint(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id
    ).first()

    if not consultation:
        return {"error": "Consultation not found"}

    # Check if report already exists
    existing_report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if existing_report:
        return existing_report

    ai_output = generate_soap(
        consultation.transcription_text
    )

    try:
        soap = json.loads(ai_output)
    except:
        return {
            "error": "Invalid AI response",
            "raw": ai_output
        }

    report = Report(
        consultation_id=consultation_id,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id,

        subjective=str(soap.get("subjective")),
        objective=str(soap.get("objective")),
        assessment=str(soap.get("assessment")),
        plan=str(soap.get("plan")),

        medications=soap.get("medications", []),
        follow_up_needed=soap.get("follow_up_needed", False),
        follow_up_days=soap.get("follow_up_days"),

        status="draft"
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report

@router.get("/{consultation_id}/report")
def get_consultation_report(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Just fetch the report, do not generate
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        return {"error": "Report not found", "status": "pending"}
    return report


@router.put("/{consultation_id}/report")
def update_consultation_report(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        return {"error": "Report not found"}

    for key, value in data.items():
        if hasattr(report, key):
            setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report

@router.post("/{consultation_id}/report/approve")
def approve_consultation_report(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        return {"error": "Report not found"}

    report.status = "approved"
    report.approved_by = current_user.user_id
    report.approved_at = datetime.now(timezone.utc)

    db.commit()
    return {"message": "Report approved"}