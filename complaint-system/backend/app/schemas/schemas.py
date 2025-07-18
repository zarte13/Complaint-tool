from pydantic import BaseModel, Field, validator, computed_field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class IssueType(str, Enum):
    WRONG_QUANTITY = "wrong_quantity"
    WRONG_PART = "wrong_part"
    DAMAGED = "damaged"
    OTHER = "other"

class ComplaintStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

# Company schemas
class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Part schemas
class PartBase(BaseModel):
    part_number: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class PartCreate(PartBase):
    pass

class PartResponse(PartBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Complaint schemas
class ComplaintBase(BaseModel):
    company_id: int
    part_id: int
    issue_type: IssueType
    details: str = Field(..., min_length=10)
    quantity_ordered: Optional[int] = Field(None, ge=0)
    quantity_received: Optional[int] = Field(None, ge=0)
    work_order_number: str = Field(..., min_length=1, max_length=100)
    occurrence: Optional[str] = Field(None, max_length=100)
    part_received: Optional[str] = Field(None, max_length=100)
    human_factor: bool = Field(default=False)
    
    @validator('quantity_received')
    def validate_quantities(cls, v, values):
        if 'issue_type' in values and values['issue_type'] == IssueType.WRONG_QUANTITY:
            if v is None or 'quantity_ordered' not in values or values['quantity_ordered'] is None:
                raise ValueError('Both quantity_ordered and quantity_received are required for wrong_quantity issues')
        return v
    
    @validator('part_received')
    def validate_part_received(cls, v, values):
        if 'issue_type' in values and values['issue_type'] == IssueType.WRONG_PART:
            if v is None or not v.strip():
                raise ValueError('Part received is required for wrong_part issues')
        return v

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    details: Optional[str] = Field(None, min_length=10)

class ComplaintResponse(BaseModel):
    id: int
    company: CompanyResponse
    part: PartResponse
    issue_type: IssueType
    details: str
    quantity_ordered: Optional[int]
    quantity_received: Optional[int]
    work_order_number: str
    occurrence: Optional[str]
    part_received: Optional[str]
    human_factor: bool
    status: ComplaintStatus
    has_attachments: bool
    created_at: datetime
    updated_at: datetime
    last_edit: Optional[datetime]
    
    class Config:
        from_attributes = True

# Attachment schemas
class AttachmentResponse(BaseModel):
    id: int
    complaint_id: int
    filename: str  # Generated unique filename
    original_filename: str  # Original uploaded filename
    file_size: int
    mime_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AttachmentUploadResponse(AttachmentResponse):
    complaint_id: int

# Search schemas
class SearchResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    size: int

class PaginationResponse(BaseModel):
    page: int
    size: int
    total: int
    total_pages: int

class ComplaintSearchResponse(BaseModel):
    items: List[ComplaintResponse]
    pagination: PaginationResponse
    
    class Config:
        from_attributes = True


# DA-004: Follow-up Actions Schemas

class ActionStatus(str, Enum):
    OPEN = "open"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    ESCALATED = "escalated"
    CLOSED = "closed"

class ActionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DependencyType(str, Enum):
    SEQUENTIAL = "sequential"
    BLOCKING = "blocking"
    OPTIONAL = "optional"

# Responsible Person schemas
class ResponsiblePersonBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    is_active: bool = Field(default=True)

class ResponsiblePersonCreate(ResponsiblePersonBase):
    pass

class ResponsiblePersonResponse(ResponsiblePersonBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Follow-up Action schemas
class FollowUpActionBase(BaseModel):
    action_text: str = Field(..., min_length=5, max_length=500)
    responsible_person: str = Field(..., min_length=2, max_length=255)
    due_date: Optional[date] = None
    priority: ActionPriority = Field(default=ActionPriority.MEDIUM)
    notes: Optional[str] = Field(None, max_length=1000)

class FollowUpActionCreate(FollowUpActionBase):
    pass

class FollowUpActionUpdate(BaseModel):
    action_text: Optional[str] = Field(None, min_length=5, max_length=500)
    responsible_person: Optional[str] = Field(None, min_length=2, max_length=255)
    due_date: Optional[date] = None
    status: Optional[ActionStatus] = None
    priority: Optional[ActionPriority] = None
    notes: Optional[str] = Field(None, max_length=1000)
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)

class FollowUpActionResponse(BaseModel):
    id: int
    complaint_id: int
    action_number: int
    action_text: str
    responsible_person: str
    due_date: Optional[date]
    status: ActionStatus
    priority: ActionPriority
    notes: Optional[str]
    completion_percentage: int
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True
    
    @computed_field
    @property
    def is_overdue(self) -> bool:
        """Check if action is overdue"""
        if self.due_date and self.status not in [ActionStatus.CLOSED]:
            return date.today() > self.due_date
        return False
    
    @computed_field
    @property
    def can_start(self) -> bool:
        """Check if action can be started (placeholder for dependency logic)"""
        # TODO: Implement dependency checking logic
        return True

# Action History schemas
class ActionHistoryResponse(BaseModel):
    id: int
    action_id: int
    field_changed: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: str
    changed_at: datetime
    change_reason: Optional[str]
    
    class Config:
        from_attributes = True

# Action Dependency schemas
class ActionDependencyCreate(BaseModel):
    depends_on_action_id: int
    dependency_type: DependencyType = Field(default=DependencyType.SEQUENTIAL)

class ActionDependencyResponse(BaseModel):
    id: int
    action_id: int
    depends_on_action_id: int
    dependency_type: DependencyType
    created_at: datetime
    
    class Config:
        from_attributes = True

# Extended Complaint Response with Actions
class ComplaintWithActionsResponse(ComplaintResponse):
    follow_up_actions: List[FollowUpActionResponse] = []
    
    class Config:
        from_attributes = True

# Bulk operations schemas
class BulkActionUpdate(BaseModel):
    action_ids: List[int] = Field(..., min_length=1, max_length=50)
    updates: FollowUpActionUpdate

class BulkActionResponse(BaseModel):
    updated_count: int
    failed_updates: List[dict] = []
    
# Action metrics for dashboard
class ActionMetrics(BaseModel):
    total_actions: int
    open_actions: int
    overdue_actions: int
    completion_rate: float
    actions_by_status: dict
    actions_by_priority: dict