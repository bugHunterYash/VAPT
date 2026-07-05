import httpx
from typing import Dict, Any, Optional

OLLAMA_API_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "qwen2.5-coder" # Fallback, user can configure this later

async def generate_completion(prompt: str, model: str = DEFAULT_MODEL, system: Optional[str] = None) -> str:
    """
    Communicates with local Ollama instance to generate AI content.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OLLAMA_API_URL, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except Exception as e:
            # Handle exception gracefully if Ollama is not running
            raise Exception(f"Failed to connect to Ollama: {str(e)}")

async def generate_finding_details(title: str, category: str) -> Dict[str, str]:
    """
    Generates a technical description and mitigation for a given finding title.
    """
    system_prompt = "You are an expert Penetration Tester and Cyber Security Consultant. Provide highly technical and actionable descriptions and mitigations for vulnerabilities."
    
    prompt = f"Write a professional vulnerability description and mitigation for the following finding:\nTitle: {title}\nCategory: {category}\nFormat the output exactly as:\nDESCRIPTION:\n[description here]\n\nMITIGATION:\n[mitigation here]"
    
    result = await generate_completion(prompt=prompt, system=system_prompt)
    
    # Parse the result
    description = ""
    mitigation = ""
    
    if "DESCRIPTION:" in result and "MITIGATION:" in result:
        parts = result.split("MITIGATION:")
        description = parts[0].replace("DESCRIPTION:", "").strip()
        mitigation = parts[1].strip()
    else:
        description = result # Fallback
        
    return {
        "description": description,
        "mitigation": mitigation
    }
