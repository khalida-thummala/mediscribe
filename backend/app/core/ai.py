import requests
import json
from app.core.config import settings

OPENAI_API_KEY = settings.OPENAI_API_KEY
ENDPOINT = settings.ENDPOINT

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
    content = data["choices"][0]["message"]["content"].strip()
    if content.startswith("```json"): content = content[7:]
    elif content.startswith("```"): content = content[3:]
    if content.endswith("```"): content = content[:-3]
    return content.strip()

def compare_medical_reports(existing_soap: dict, new_analysis: dict):
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-mock-key":
        return {
            "summary": "Comparison simulated. No major conflicts detected.",
            "discrepancies": ["Dosage of Paracetamol differs slightly."],
            "new_info": ["Patient mentioned a previous allergy to Penicillin which was not in old records."],
            "conflicts": []
        }

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    prompt = f"""
    Compare these two clinical reports for the same patient.
    Existing Record: {json.dumps(existing_soap)}
    New AI Analysis: {json.dumps(new_analysis)}
    
    Identify:
    1. Summary of changes.
    2. Discrepancies (conflicting data).
    3. New information found in the analysis but missing in old records.
    4. Critical conflicts.
    
    Return ONLY JSON with keys: summary, discrepancies, new_info, conflicts.
    """

    body = {
        "messages": [
            {"role": "system", "content": "You are a clinical auditor. Compare medical reports accurately."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(ENDPOINT, headers=headers, json=body)
    if response.status_code != 200:
        return {"summary": "Error comparing", "discrepancies": [], "new_info": [], "conflicts": []}

    content = response.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```json"): content = content[7:]
    elif content.startswith("```"): content = content[3:]
    if content.endswith("```"): content = content[:-3]
    try:
        return json.loads(content)
    except:
        return {"summary": "Parse error in comparison", "discrepancies": [], "new_info": [], "conflicts": []}

def check_drug_interactions(medications: list):
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-mock-key":
        return [
            {"severity": "High", "interaction": "Warfarin and Aspirin", "reason": "Increased risk of bleeding."}
        ]

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    prompt = f"""
    Check for potential drug-drug interactions in this list: {json.dumps(medications)}
    Identify severity (High/Medium/Low), the interacting pair, and a brief reason.
    Return ONLY JSON list of objects: [{{"severity": "...", "interaction": "...", "reason": "..."}}]
    """

    body = {
        "messages": [
            {"role": "system", "content": "You are a clinical pharmacologist. Check interactions accurately."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(ENDPOINT, headers=headers, json=body)
    if response.status_code != 200:
        return []

    content = response.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```json"): content = content[7:]
    elif content.startswith("```"): content = content[3:]
    if content.endswith("```"): content = content[:-3]
    try:
        return json.loads(content)
    except:
        return []