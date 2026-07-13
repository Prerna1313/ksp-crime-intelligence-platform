from sqlalchemy import Column, String, DateTime, ForeignKey, text, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from .base import Base
from .user import generate_uuid

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    last_activity = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User")
    case = relationship("Case", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # USER, ASSISTANT
    content = Column(Text, nullable=False)
    content_kannada = Column(Text, nullable=True)
    confidence_tier = Column(String(20), nullable=True)  # VERY_HIGH, HIGH, MODERATE, LOW, VERY_LOW
    sources = Column(JSON, nullable=True)  # JSON array: [{"case_id": ..., "record_type": ..., "description": ...}]
    reasoning_trace_id = Column(String(36), nullable=True)
    has_conflict = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    conversation = relationship("Conversation", back_populates="messages")

