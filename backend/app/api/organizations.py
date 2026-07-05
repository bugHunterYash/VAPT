from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.organization import Organization as DBOrganization
from app.schemas.organization import Organization, OrganizationCreate, OrganizationUpdate
from app.api.deps import get_current_active_user
from app.models.user import User, RoleEnum

router = APIRouter()

@router.post("/", response_model=Organization)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    db_org = DBOrganization(**org_in.model_dump())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

@router.get("/", response_model=List[Organization])
def read_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(DBOrganization).offset(skip).limit(limit).all()
