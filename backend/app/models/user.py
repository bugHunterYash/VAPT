from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.db.database import Base
import enum

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    auditor = "auditor"
    reviewer = "reviewer"
    client = "client"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.auditor)
    is_active = Column(Boolean, default=True)
