from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class ProjectStatusEnum(str, enum.Enum):
    assigned = "Assigned"
    accepted = "Accepted"
    in_progress = "In Progress"
    draft_ready = "Draft Ready"
    submitted_for_review = "Submitted For Review"
    review_in_progress = "Review In Progress"
    changes_requested = "Changes Requested"
    approved = "Approved"
    report_generated = "Report Generated"
    delivered = "Delivered"
    revalidation_1 = "Revalidation 1"
    revalidation_2 = "Revalidation 2"
    revalidation_3 = "Revalidation 3"
    completed = "Completed"
    closed = "Closed"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    application_name = Column(String)
    application_url = Column(String)
    ip_address = Column(String)
    scope = Column(String)
    environment = Column(String)
    status = Column(Enum(ProjectStatusEnum), default=ProjectStatusEnum.assigned)
    assessment_type = Column(String)
    
    auditor_id = Column(Integer, ForeignKey("users.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))

    organization = relationship("Organization")
    auditor = relationship("User", foreign_keys=[auditor_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
