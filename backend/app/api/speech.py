import os
from fastapi import APIRouter, UploadFile, File
from app.core.speech import transcribe_audio

router = APIRouter()

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Read the file content as bytes
    audio_data = await file.read()

    # Call our core transcription engine with the bytes
    result = transcribe_audio(audio_data, consultation_id="api_upload")

    return {
        "transcription": result["text"],
        "status": result["status"],
        "job_id": result["job_id"]
    }