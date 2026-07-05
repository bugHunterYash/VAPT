import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.project import Project as DBProject
from app.models.finding import Finding as DBFinding
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.report_service import generate_docx_report

router = APIRouter()

@router.get("/generate/{project_id}")
def generate_project_report(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    findings = db.query(DBFinding).filter(DBFinding.project_id == project_id).all()
    
    try:
        report_path = generate_docx_report(project, findings)
        return FileResponse(
            path=report_path, 
            filename=f"{project.name.replace(' ', '_')}_VAPT_Report.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
