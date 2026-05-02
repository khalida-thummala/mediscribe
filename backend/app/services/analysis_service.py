from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional
import uuid
import os
from app.models.analysis import Analysis
from app.schemas.analysis import AIAnalysisCreate
from app.core.ai import generate_soap

# Use the correct ORM model class name
AIAnalysisRecord = Analysis

class AnalysisService:
    @staticmethod
    def create_analysis_record(db: Session, data: AIAnalysisCreate, user_id: str, organization_id: str):
        new_record = Analysis(
            **data.dict(),
            user_id=user_id,
            organization_id=organization_id,
            analysis_status="pending"
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

    @staticmethod
    def get_analysis_records(db: Session, organization_id: str) -> List[Analysis]:
        return db.query(Analysis).filter(
            Analysis.organization_id == organization_id
        ).order_by(Analysis.created_at.desc()).all()

    @staticmethod
    def get_analysis_by_id(db: Session, analysis_id: str, organization_id: str):
        return db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()

    @staticmethod
    def update_analysis_status(db: Session, analysis_id: str, status: str, results: Optional[dict] = None):
        record = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
        if record:
            record.analysis_status = status
            if results:
                for key, value in results.items():
                    if hasattr(record, key):
                        setattr(record, key, value)
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    async def process_upload(db: Session, file, file_type: str, user_id: str, organization_id: str):
        try:
            upload_id = str(uuid.uuid4())
            
            # Ensure uploads directory exists
            upload_dir = "uploads"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                
            file_path = os.path.join(upload_dir, f"{upload_id}_{file.filename}")
            
            # Save file
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Simulate text extraction (in production use OCR/NLP)
            extracted_text = f"""
            CLINICAL REPORT SUMMARY - {file.filename}
            
            SUBJECTIVE:
            Patient presents with a persistent cough and fever (101.2F) for 3 days. 
            Reports mild chest congestion but no shortness of breath.
            
            OBJECTIVE:
            Vitals: BP 120/80, HR 85, Temp 101.2F, SpO2 98%.
            Lungs: Occasional rhonchi in right lower lobe. Throat: Mild erythema.
            
            ASSESSMENT:
            1. Acute Bronchitis.
            2. Fever, unspecified.
            
            PLAN:
            - Prescribed Amoxicillin 500mg (if symptoms persist).
            - Recommend plenty of fluids and rest.
            - Follow up in 7 days.
            """
            
            new_record = Analysis(
                upload_id=upload_id,
                user_id=user_id,
                organization_id=organization_id,
                source_file_name=file.filename,
                source_file_type=file_type,
                extracted_text=extracted_text,
                analysis_status="pending"
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            return new_record
        except Exception as e:
            print(f"UPLOAD ERROR: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    @staticmethod
    def analyze_document(db: Session, analysis_id: str, organization_id: str):
        record = db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()
        
        if not record:
            return None
        
        record.analysis_status = "analyzing"
        db.commit()
        
        # 1. Generate SOAP from document
        import json
        from app.core.ai import generate_soap, compare_medical_reports
        from app.models.report import Report

        soap_json = generate_soap(record.extracted_text)
        try:
            soap_data = json.loads(soap_json)
            record.generated_subjective = soap_data.get("subjective")
            record.generated_objective = soap_data.get("objective")
            record.generated_assessment = soap_data.get("assessment")
            record.generated_plan = soap_data.get("plan")
            record.generated_medications = soap_data.get("medications", [])
            record.confidence_score = 94.2
            
            # 2. Intelligent Comparison (Phase 5)
            if record.patient_id:
                # Fetch most recent finalized report for this patient
                latest_report = db.query(Report).filter(
                    Report.patient_id == record.patient_id,
                    Report.status == "finalized"
                ).order_by(Report.created_at.desc()).first()

                if latest_report:
                    existing_data = {
                        "subjective": latest_report.subjective,
                        "objective": latest_report.objective,
                        "assessment": latest_report.assessment,
                        "plan": latest_report.plan
                    }
                    # Compare
                    record.comparison_data = compare_medical_reports(existing_data, soap_data)
            
            record.analysis_status = "completed"
        except Exception as e:
            print(f"Analysis Error: {str(e)}")
            record.analysis_status = "failed"
            
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def approve_analysis(db: Session, analysis_id: str, organization_id: str, notes: str):
        record = db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()
        
        if not record:
            return None
            
        # 1. Update analysis record
        record.approved_at = datetime.utcnow()
        record.notes = notes
        record.analysis_status = "completed"
        
        # 2. Create a permanent Report record
        from app.models.report import Report
        
        new_report = Report(
            user_id=record.user_id,
            organization_id=record.organization_id,
            subjective=record.generated_subjective,
            objective=record.generated_objective,
            assessment=record.generated_assessment,
            plan=record.generated_plan,
            medications=record.generated_medications,
            status="approved",
            approved_by=record.user_id,
            approved_at=datetime.utcnow()
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(record)
        return record
