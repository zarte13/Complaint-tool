from pydantic import BaseModel, Field, validator, computed_field, model_validator
from typing import Optional, List, Dict
from datetime import datetime, date
from enum import Enum

class IssueType(str, Enum):
    WRONG_QUANTITY = "wrong_quantity"
    WRONG_PART = "wrong_part"
    DAMAGED = "damaged"
    OTHER = "other"

class ComplaintStatus(str, Enum):
    OPEN = "open"
    IN_PLANNING = "in_planning"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

# FF-002: Issue categories and subtypes (i18n-ready taxonomy)
class IssueCategory(str, Enum):
    DIMENSIONAL = "dimensional"
    VISUAL = "visual"
    PACKAGING = "packaging"
    OTHER = "other"

# Visual subtypes
ALLOWED_VISUAL_SUBTYPES = {"scratch", "nicks", "rust"}

# Packaging subtypes (multi-select allowed)
ALLOWED_PACKAGING_SUBTYPES = {
    "wrong_box",
    "wrong_bag",
    "wrong_paper",
    "wrong_part",
    "wrong_quantity",
    "wrong_tags",
}

# Company schemas
class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    company_short: Optional[str] = Field(None, max_length=100)

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
    follow_up: Optional[str] = Field(None, max_length=1000)
    date_received: date
    complaint_kind: str = Field(..., pattern=r"^(official|notification)$")
    ncr_number: Optional[str] = Field(None, max_length=100)
    quantity_ordered: Optional[int] = Field(None, ge=0)
    quantity_received: Optional[int] = Field(None, ge=0)
    work_order_number: str = Field(..., min_length=1, max_length=100)
    occurrence: Optional[str] = Field(None, max_length=100)
    part_received: Optional[str] = Field(None, max_length=100)
    human_factor: bool = Field(default=False)
    # FF-002 additions (all optional for backward compatibility)
    issue_category: Optional[IssueCategory] = None
    issue_subtypes: Optional[List[str]] = None
    packaging_received: Optional[Dict[str, str]] = None
    packaging_expected: Optional[Dict[str, str]] = None
    
    @validator('quantity_received')
    def validate_quantities(cls, v, values):
        # For legacy wrong_quantity, require quantities unless FF-002 packaging path is used
        if values.get('issue_type') == IssueType.WRONG_QUANTITY:
            issue_category = values.get('issue_category')
            subtypes = values.get('issue_subtypes') or []
            if issue_category == IssueCategory.PACKAGING and ('wrong_quantity' in subtypes):
                # Use packaging_received/expected instead; skip enforcing top-level quantities
                return v
            if v is None or values.get('quantity_ordered') is None:
                raise ValueError('Both quantity_ordered and quantity_received are required for wrong_quantity issues')
        return v
    
    @validator('part_received')
    def validate_part_received(cls, v, values):
        if 'issue_type' in values and values['issue_type'] == IssueType.WRONG_PART:
            if v is None or not v.strip():
                raise ValueError('Part received is required for wrong_part issues')
        return v

    @validator('issue_subtypes')
    def validate_issue_subtypes(cls, v, values):
        if v is None:
            return v
        category: Optional[IssueCategory] = values.get('issue_category')
        if category == IssueCategory.VISUAL:
            invalid = [s for s in v if s not in ALLOWED_VISUAL_SUBTYPES]
            if invalid:
                raise ValueError(f"Invalid visual subtypes: {invalid}")
        elif category == IssueCategory.PACKAGING:
            invalid = [s for s in v if s not in ALLOWED_PACKAGING_SUBTYPES]
            if invalid:
                raise ValueError(f"Invalid packaging subtypes: {invalid}")
        return v

    @model_validator(mode='after')
    def validate_packaging_details(self):
        # When category is packaging, require Received/Expected for specific subtypes
        if self.issue_category == IssueCategory.PACKAGING and self.issue_subtypes:
            required_pairs = {"wrong_box", "wrong_bag", "wrong_paper", "wrong_quantity"}
            recv = self.packaging_received or {}
            exp = self.packaging_expected or {}
            for subtype in self.issue_subtypes:
                if subtype in required_pairs:
                    if not recv.get(subtype):
                        raise ValueError(f"packaging_received['{subtype}'] is required")
                    if not exp.get(subtype):
                        raise ValueError(f"packaging_expected['{subtype}'] is required")
        return self

    @model_validator(mode='after')
    def validate_ncr_requirement(self):
        # NCR number required when complaint is official
        if getattr(self, 'complaint_kind', None) == 'official':
            if not getattr(self, 'ncr_number', None):
                raise ValueError('ncr_number is required when complaint_kind is official')
        return self

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    # Accept broader inputs for status to support legacy synonyms like "closed"
    status: Optional[str] = None
    details: Optional[str] = Field(None, min_length=10)
    follow_up: Optional[str] = Field(None, max_length=1000)
    # Allow updating FF-002 fields
    issue_category: Optional[IssueCategory] = None
    issue_subtypes: Optional[List[str]] = None
    packaging_received: Optional[Dict[str, str]] = None
    packaging_expected: Optional[Dict[str, str]] = None
    date_received: Optional[date] = None
    complaint_kind: Optional[str] = Field(None, pattern=r"^(official|notification)$")
    ncr_number: Optional[str] = Field(None, max_length=100)

    @validator('status')
    def normalize_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        s = v.strip().lower()
        # Map external synonym "closed" to canonical internal "resolved"
        if s == "closed":
            return "resolved"
        # Allow only known canonical values
        allowed = {"open", "in_planning", "in_progress", "resolved"}
        if s not in allowed:
            raise ValueError(f"Invalid status '{v}'. Allowed: open, in_planning, in_progress, resolved (or 'closed' synonym).")
        return s

class ComplaintResponse(BaseModel):
    id: int
    company: CompanyResponse
    part: PartResponse
    issue_type: IssueType
    issue_category: Optional[IssueCategory]
    issue_subtypes: Optional[List[str]]
    packaging_received: Optional[Dict[str, str]]
    packaging_expected: Optional[Dict[str, str]]
    details: str
    follow_up: Optional[str]
    date_received: date
    complaint_kind: str
    ncr_number: Optional[str]
    quantity_ordered: Optional[int]
    quantity_received: Optional[int]
    work_order_number: str
    occurrence: Optional[str]
    part_received: Optional[str]
    human_factor: bool
    # Present-friendly: expose "closed" instead of canonical "resolved"
    status: str
    has_attachments: bool
    created_at: datetime
    updated_at: datetime
    last_edit: Optional[datetime]
    created_by: Optional[str]
    
    class Config:
        from_attributes = True

    @validator("status", pre=True)
    def present_status_alias(cls, v):
        # v may be enum or string
        sval = str(v).lower() if v is not None else v
        if sval == "resolved":
            return "closed"
        return sval

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

class ResponsiblePersonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None

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
    created_by: Optional[str]
    
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