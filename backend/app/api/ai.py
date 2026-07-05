from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.ai_service import generate_finding_details

router = APIRouter()

class FindingGenerateRequest(BaseModel):
    title: str
    category: str

@router.post("/generate-finding", response_model=Dict[str, str])
async def ai_generate_finding(
    request: FindingGenerateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate finding description and mitigation using local Ollama instance.
    """
    try:
        result = await generate_finding_details(request.title, request.category)
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
