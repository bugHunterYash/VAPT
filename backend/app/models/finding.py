from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, nullable=False)
    category = Column(String)
    severity = Column(String)
    cvss = Column(String)
    cwe = Column(String)
    owasp = Column(String)
    
    affected_asset = Column(String)
    affected_url = Column(String)
    affected_parameter = Column(String)
    
    request_data = Column(Text)
    response_data = Column(Text)
    
    description = Column(Text)
    business_impact = Column(Text)
    technical_impact = Column(Text)
    mitigation = Column(Text)
    references = Column(Text)
    proof_of_concept = Column(Text)
    
    status = Column(String, default="Open")
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    project = relationship("Project")
    created_by = relationship("User", foreign_keys=[created_by_id])
