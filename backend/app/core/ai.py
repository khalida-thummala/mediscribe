import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ENDPOINT = os.getenv("ENDPOINT")

 

def generate_soap(text: str):
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-mock-key":

        return json.dumps({
            "subjective": "Patient reports feeling fatigued and has a mild cough for the past 3 days.",
            "objective": "Temperature is 98.6F. Lungs are clear to auscultation. Throat is slightly erythematous.",
            "assessment": "1. Viral upper respiratory infection.\n2. Fatigue secondary to illness.",
            "plan": "1. Rest and hydrate.\n2. Over-the-counter throat lozenges.\n3. Return to clinic if symptoms worsen.",
            "medications": [],
            "follow_up_needed": False,
            "follow_up_days": None
        })

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "messages": [
            {
                "role": "system",
                "content": "Convert medical text into SOAP format in JSON with keys: subjective, objective, assessment, plan"
            },
            {
                "role": "user",
                "content": text
            }
        ]
    }

    response = requests.post(ENDPOINT, headers=headers, json=body)

    if response.status_code != 200:
        return '{"subjective": "Error generating", "objective": "", "assessment": "", "plan": ""}'

    data = response.json()

    # 🔥 Extract AI response
    content = data["choices"][0]["message"]["content"]
    # Strip markdown if present
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()