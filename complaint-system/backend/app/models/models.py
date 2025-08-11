from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
try:
    # SQLAlchemy JSON type; maps to TEXT on SQLite with json serialization
    from sqlalchemy import JSON  # type: ignore
except Exception:  # pragma: no cover
    JSON = Text  # Fallback for environments without JSON type
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    complaints = relationship("Complaint", back_populates="company")

class Part(Base):
    __tablename__ = "parts"
    
    id = Column(Integer, primary_key=True, index=True)
    part_number = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    complaints = relationship("Complaint", back_populates="part")

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False)
    # Legacy single issue type kept for backward-compatibility with existing UI/tests
    issue_type = Column(String(50), nullable=False)  # wrong_quantity, wrong_part, damaged, other
    # New taxonomy (FF-002): category + subtypes
    issue_category = Column(String(20), nullable=True)  # dimensional, visual, packaging, other
    issue_subtypes = Column(SQLITE_JSON, nullable=True)  # List[str]
    # Packaging details keyed by subtype (e.g., wrong_box, wrong_bag, wrong_paper, wrong_quantity)
    packaging_received = Column(SQLITE_JSON, nullable=True)
    packaging_expected = Column(SQLITE_JSON, nullable=True)
    details = Column(Text, nullable=False)
    quantity_ordered = Column(Integer)
    quantity_received = Column(Integer)
    work_order_number = Column(String(100), nullable=False)  # Numero de bon de travail
    occurrence = Column(String(100))  # Occurence
    part_received = Column(String(100))  # Part received (for wrong_part issues)
    human_factor = Column(Boolean, default=False)  # Cause avec facteur humain
    status = Column(String(20), default="open")  # open, in_progress, resolved (DB enforced enum)
    has_attachments = Column(Boolean, default=False)
    # Audit: username of creator (users live in separate DB; no FK here)
    created_by = Column(String(150), nullable=True)
    # Soft delete flag: when True, the complaint is hidden from all list/detail APIs
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_edit = Column(DateTime(timezone=True), nullable=True)
    
    company = relationship("Company", back_populates="complaints")
    part = relationship("Part", back_populates="complaints")
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    follow_up_actions = relationship("FollowUpAction", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    filename = Column(String(255), nullable=False)  # Generated unique filename
    original_filename = Column(String(255), nullable=False)  # Original filename
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    complaint = relationship("Complaint", back_populates="attachments")


# DA-004: Follow-up Actions Models

class FollowUpAction(Base):
    __tablename__ = "follow_up_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    action_number = Column(Integer, nullable=False)
    action_text = Column(Text, nullable=False)
    responsible_person = Column(String(255), nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="open")  # open, pending, in_progress, blocked, escalated, closed
    priority = Column(String(10), default="medium")  # low, medium, high, critical
    notes = Column(Text, nullable=True)
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    # Audit: username of creator (users live in separate DB; no FK here)
    created_by = Column(String(150), nullable=True)
    
    # Relationships
    complaint = relationship("Complaint", back_populates="follow_up_actions")
    history = relationship("ActionHistory", back_populates="action", cascade="all, delete-orphan")
    dependencies = relationship("ActionDependency", 
                              foreign_keys="ActionDependency.action_id", 
                              back_populates="action")

class ActionHistory(Base):
    __tablename__ = "action_history"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("follow_up_actions.id"), nullable=False)
    field_changed = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_by = Column(String(255), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    change_reason = Column(Text, nullable=True)
    
    action = relationship("FollowUpAction", back_populates="history")

class ResponsiblePerson(Base):
    __tablename__ = "responsible_persons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ActionDependency(Base):
    __tablename__ = "action_dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("follow_up_actions.id"), nullable=False)
    depends_on_action_id = Column(Integer, ForeignKey("follow_up_actions.id"), nullable=False)
    dependency_type = Column(String(20), default="sequential")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    action = relationship("FollowUpAction", 
                         foreign_keys=[action_id], 
                         back_populates="dependencies")