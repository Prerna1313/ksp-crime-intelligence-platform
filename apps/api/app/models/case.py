from sqlalchemy import Column, String, Date, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from .base import Base
from .user import generate_uuid

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_number = Column(String(50), unique=True, nullable=False)
    case_type = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    station_id = Column(String(36), ForeignKey("stations.id"))
    assigned_officer_id = Column(String(36), ForeignKey("users.id"))
    incident_date = Column(Date)
    incident_location = Column(String(255)) # WKT representation of the POINT
    incident_address = Column(Text)
    narrative = Column(Text)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    station = relationship("Station", back_populates="cases")
    assigned_officer = relationship("User")
    conversations = relationship("Conversation", back_populates="case")
