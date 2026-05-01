import requests
import os


AZURE_SPEECH_KEY = os.getenv("OPENAI_API_KEY")
AZURE_SPEECH_ENDPOINT = os.getenv("ENDPOINT")


def transcribe_audio(file_path):
    # later compress audio here

    if not AZURE_SPEECH_KEY or AZURE_SPEECH_KEY == "mock-key" or AZURE_SPEECH_KEY == "sk-mock-key":
        return "This is a mock transcription because no valid Azure API key was provided. The patient came in complaining of a sore throat and mild fatigue."

    try:
        with open(file_path, "rb") as audio:
            audio_data = audio.read()
    except:
        return "Could not read audio file."

    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Content-Type": "audio/wav"
    }

    response = requests.post(
        AZURE_SPEECH_ENDPOINT,
        headers=headers,
        data=audio_data
    )

    if response.status_code != 200:
        return "API Error: Could not transcribe audio."

    result = response.json()

    transcript = result.get("DisplayText", "")

    if len(transcript) < 5:
        return "Low quality transcription"

    return transcript