from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.finding import Finding as DBFinding
from app.models.project import Project as DBProject
from app.schemas.finding import Finding, FindingCreate, FindingUpdate
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum

router = APIRouter()

@router.post("/", response_model=Finding)
def create_finding(
    finding_in: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    project = db.query(DBProject).filter(DBProject.id == finding_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.role == RoleEnum.auditor and project.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this project")
        
    finding_in.created_by_id = current_user.id
    db_finding = DBFinding(**finding_in.model_dump())
    db.add(db_finding)
    db.commit()
    db.refresh(db_finding)
    return db_finding

@router.get("/project/{project_id}", response_model=List[Finding])
def read_findings_for_project(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return db.query(DBFinding).filter(DBFinding.project_id == project_id).offset(skip).limit(limit).all()
