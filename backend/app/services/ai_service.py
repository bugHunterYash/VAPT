import os
import json
import httpx
from typing import Dict, Any, Optional
import re

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
OLLAMA_API_URL = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"

async def verify_ollama():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(OLLAMA_TAGS_URL, timeout=10.0)
            if resp.status_code != 200:
                raise Exception("Local AI service is unavailable. Start Ollama and verify the configured model.")
            data = resp.json()
            models = [m.get("name") for m in data.get("models", [])]
            if OLLAMA_MODEL not in models and f"{OLLAMA_MODEL}:latest" not in models:
                raise Exception(f"AI Model '{OLLAMA_MODEL}' is not installed in Ollama. Please run: ollama pull {OLLAMA_MODEL}")
        except httpx.RequestError:
            raise Exception("Local AI service is unavailable. Start Ollama and verify the configured model.")

async def generate_completion(prompt: str, model: str = OLLAMA_MODEL, system: Optional[str] = None) -> str:
    """
    Communicates with local Ollama instance to generate AI content.
    """
    await verify_ollama()
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
            "top_p": 0.85
        }
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OLLAMA_API_URL, json=payload, timeout=120.0)
            if response.status_code != 200:
                raise Exception(f"Ollama error {response.status_code}: {response.text}")
            data = response.json()
            return data.get("response", "")
        except httpx.TimeoutException:
            raise Exception("AI service timed out after 120 seconds. Ensure your local machine can handle the inference workload.")
        except Exception as e:
            raise Exception(f"Failed to connect to Ollama: {str(e)}")

async def generate_finding_details(short_input: str) -> Dict[str, Any]:
    """
    Generates a technical description, impact, and mitigation based on short input.
    """
    system_prompt = (
        "You are a professional cybersecurity VAPT report-writing assistant. "
        "Your job is to transform auditor-provided vulnerability information into clear, technically accurate, professional penetration-testing report content. "
        "Auditor-provided project information, vulnerability observations, affected URLs, severity and evidence are authoritative facts. "
        "Never invent URLs, parameters, payloads, HTTP requests, credentials, versions, CVSS scores, or specific evidence unless supplied by the auditor. "
        "You ARE expected to use cybersecurity knowledge to provide comprehensive technical descriptions, recognized vulnerability classifications, likely security impact, and actionable remediation guidance. "
        "Write as a senior penetration tester preparing a formal client deliverable. "
        "Return STRICT JSON with EXACTLY five keys: owasp_mapping, cwe_id, description, impact, mitigation."
    )
    
    prompt = (
        f"Based on the following short input from a tester, generate a professional vulnerability report section.\n"
        f"Input: {short_input}\n\n"
        "Return STRICT JSON exactly matching this structure, with no markdown formatting or extra text.\n"
        "The description should be 100-180 words. The impact should be detailed. The mitigation should have 5-8 actionable recommendations separated by newlines.\n"
        "The owasp_mapping must contain ONLY the human-readable category name (e.g., 'Broken Access Control').\n"
        "The cwe_id must be standard format (e.g., 'CWE-89').\n"
        "{\n"
        '  "owasp_mapping": "",\n'
        '  "cwe_id": "",\n'
        '  "description": "",\n'
        '  "impact": "",\n'
        '  "mitigation": ""\n'
        "}"
    )
    
    result = await generate_completion(prompt=prompt, system=system_prompt)
    
    try:
        # Strip markdown fences safely
        result = result.strip()
        result = re.sub(r'^```json\s*', '', result)
        result = re.sub(r'^```\s*', '', result)
        result = re.sub(r'\s*```$', '', result)
        
        parsed = json.loads(result)
        
        return {
            "owaspMapping": str(parsed.get("owasp_mapping", "")),
            "cweId": str(parsed.get("cwe_id", "")),
            "description": str(parsed.get("description", "")),
            "impact": str(parsed.get("impact", "")),
            "mitigation": str(parsed.get("mitigation", ""))
        }
    except json.JSONDecodeError:
        raise Exception("AI returned an invalid response that could not be parsed.")
