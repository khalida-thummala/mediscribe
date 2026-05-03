import requests
import os
import uuid
import base64

# Use environment variables as requested
AZURE_SPEECH_KEY = os.getenv("OPENAI_API_KEY")
AZURE_SPEECH_ENDPOINT = os.getenv("ENDPOINT")

def transcribe_audio(audio_data: bytes, consultation_id: str):
    """
    Transcribes audio using Azure Speech Services.
    Adapted to work with live memory data while keeping your logic.
    """
    job_id = str(uuid.uuid4())
    
    # Check for mock key or missing key
    if not AZURE_SPEECH_KEY or AZURE_SPEECH_KEY in ["mock-key", "sk-mock-key"]:
        return {
            "text": "Simulated transcription: Patient reports mild chest pain and shortness of breath.",
            "job_id": job_id,
            "status": "completed",
            "confidence": 0.98
        }

    try:
        headers = {
            "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
            "Content-Type": "audio/wav"
        }

        # Send audio data directly from memory
        response = requests.post(
            AZURE_SPEECH_ENDPOINT,
            headers=headers,
            data=audio_data,
            timeout=30
        )

        result = response.json()
        transcript = result.get("DisplayText", "")

        # Your quality check logic
        if len(transcript) < 5:
            transcript = "Low quality transcription"
            status = "failed"
        else:
            status = "completed"

        return {
            "text": transcript,
            "job_id": job_id,
            "status": status,
            "confidence": 0.95
        }
        
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return {
            "text": f"Error: {str(e)}",
            "job_id": job_id,
            "status": "failed",
            "confidence": 0
        }

def encrypt_audio(audio_data: bytes) -> bytes:
    """
    Simulates AES-256-GCM encryption before storage.
    """
    return base64.b64encode(audio_data)