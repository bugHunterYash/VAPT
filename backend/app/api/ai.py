from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.ai_service import generate_finding_details

router = APIRouter()

class FindingGenerateRequest(BaseModel):
    short_input: str

@router.post("/generate-finding", response_model=Dict[str, Any])
async def ai_generate_finding(
    request: FindingGenerateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate finding details using local Ollama instance based on short text.
    """
    try:
        result = await generate_finding_details(request.short_input)
        return result
    except Exception as e:
        error_msg = str(e)
        status_code = 503 if "unavailable" in error_msg.lower() or "timed out" in error_msg.lower() else 500
        raise HTTPException(status_code=status_code, detail=error_msg)
