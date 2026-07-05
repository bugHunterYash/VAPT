from pydantic import BaseModel
from typing import Optional

class OrganizationBase(BaseModel):
    name: str
    contact_email: Optional[str] = None
    website: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None

class Organization(OrganizationBase):
    id: int

    class Config:
        from_attributes = True
