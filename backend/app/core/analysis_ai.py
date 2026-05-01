import requests
import json

import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ENDPOINT = os.getenv("ENDPOINT")



def generate_analysis(text: str):
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-mock-key":
        return json.dumps({
            "subjective": "Patient reports mild chest discomfort and shortness of breath.",
            "objective": "Heart rate is 88 bpm. Blood pressure is 130/85.",
            "assessment": "Possible mild angina or acid reflux.",
            "plan": "Schedule an ECG and prescribe antacids.",
            "medications": ["Antacids"],
            "confidence_score": 92.5,
            "key_entities": {"symptoms": ["chest discomfort", "shortness of breath"]},
            "comparison_data": {"differences": "Added ECG recommendation."}
        })

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "messages": [
            {
                "role": "user",
                "content": f"""
Analyze this medical report and return ONLY valid JSON:

{{
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan": "",
  "medications": [],
  "confidence_score": 95.0,
  "key_entities": {{}},
  "comparison_data": {{}}
}}

Medical Report:
{text}
"""
            }
        ]
    }

    try:
        response = requests.post(ENDPOINT, headers=headers, json=body)
        data = response.json()
        if "choices" not in data:
            return json.dumps({"error": data})
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        return json.dumps({"error": str(e)})