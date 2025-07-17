from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
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
    CLOSED = "closed"

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