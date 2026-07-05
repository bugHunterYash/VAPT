from pydantic import BaseModel
from typing import Optional
from app.models.project import ProjectStatusEnum

class ProjectBase(BaseModel):
    name: str
    organization_id: int
    application_name: Optional[str] = None
    application_url: Optional[str] = None
    ip_address: Optional[str] = None
    scope: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[ProjectStatusEnum] = ProjectStatusEnum.assigned
    assessment_type: Optional[str] = None
    auditor_id: Optional[int] = None
    reviewer_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None
    organization_id: Optional[int] = None

class Project(ProjectBase):
    id: int

    class Config:
        from_attributes = True
