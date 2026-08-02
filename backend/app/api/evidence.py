from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Dict
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.storage_service import upload_evidence

router = APIRouter()

@router.post("/upload", response_model=Dict[str, str])
async def upload_evidence_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload an evidence image and return its storage path.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WEBP are allowed.")
    
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")
            
        file_path = upload_evidence(contents, file.content_type, file.filename)
        return {"filePath": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload evidence: {str(e)}")
