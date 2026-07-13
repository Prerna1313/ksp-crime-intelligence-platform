from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from .base import Base
from .user import generate_uuid

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    canonical_name = Column(String(300), nullable=False)
    entity_type = Column(String(50), nullable=False)
    neo4j_node_id = Column(String(100))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    aliases = relationship("EntityAlias", back_populates="entity", cascade="all, delete-orphan")
    case_links = relationship("CaseEntityLink", back_populates="entity")

class EntityAlias(Base):
    __tablename__ = "entity_aliases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"))
    alias_text = Column(String(300), nullable=False)
    script = Column(String(20))
    source_case_id = Column(String(36), ForeignKey("cases.id"))
    confidence = Column(Numeric(3, 2))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    entity = relationship("Entity", back_populates="aliases")

class CaseEntityLink(Base):
    __tablename__ = "case_entity_links"

    case_id = Column(String(36), ForeignKey("cases.id"), primary_key=True)
    entity_id = Column(String(36), ForeignKey("entities.id"), primary_key=True)
    role = Column(String(100), primary_key=True)
    confidence = Column(Numeric(3, 2))

    case = relationship("Case")
    entity = relationship("Entity", back_populates="case_links")
