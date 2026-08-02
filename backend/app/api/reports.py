from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import Dict, Any
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.report_service import generate_docx_report, generate_excel_report

router = APIRouter()

@router.post("/docx")
async def generate_docx(
    project_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    try:
        buffer = generate_docx_report(project_data)
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate DOCX: {str(e)}")

@router.post("/pdf")
async def generate_pdf(
    project_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    from app.services.report_service import generate_pdf_report
    try:
        buffer = generate_pdf_report(project_data)
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.post("/excel")
async def generate_excel(
    project_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    try:
        buffer = generate_excel_report(project_data)
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel: {str(e)}")
