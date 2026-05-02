from app.core.speech import transcribe_audio

class TranscriptionService:
    @staticmethod
    async def transcribe(audio_content: bytes):
        # This calls the existing core logic for Azure integration
        return await transcribe_audio(audio_content)
