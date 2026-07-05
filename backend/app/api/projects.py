from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.project import Project as DBProject
from app.schemas.project import Project, ProjectCreate, ProjectUpdate
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum

router = APIRouter()

@router.post("/", response_model=Project)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_project = DBProject(**project_in.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[Project])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(DBProject)
    
    # Filter projects based on role
    if current_user.role == RoleEnum.auditor:
        query = query.filter(DBProject.auditor_id == current_user.id)
    elif current_user.role == RoleEnum.reviewer:
        query = query.filter(DBProject.reviewer_id == current_user.id)
        
    return query.offset(skip).limit(limit).all()
