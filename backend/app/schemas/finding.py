from pydantic import BaseModel
from typing import Optional

class FindingBase(BaseModel):
    project_id: int
    title: str
    category: Optional[str] = None
    severity: Optional[str] = None
    cvss: Optional[str] = None
    cwe: Optional[str] = None
    owasp: Optional[str] = None
    
    affected_asset: Optional[str] = None
    affected_url: Optional[str] = None
    affected_parameter: Optional[str] = None
    
    request_data: Optional[str] = None
    response_data: Optional[str] = None
    
    description: Optional[str] = None
    business_impact: Optional[str] = None
    technical_impact: Optional[str] = None
    mitigation: Optional[str] = None
    references: Optional[str] = None
    proof_of_concept: Optional[str] = None
    
    status: Optional[str] = "Open"
    created_by_id: Optional[int] = None

class FindingCreate(FindingBase):
    pass

class FindingUpdate(FindingBase):
    title: Optional[str] = None
    project_id: Optional[int] = None

class Finding(FindingBase):
    id: int

    class Config:
        from_attributes = True
