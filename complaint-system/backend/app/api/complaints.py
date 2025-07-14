from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app.database.database import get_db
from app.models.models import Complaint, Company, Part, ComplaintAttachment
from app.schemas.schemas import (
    ComplaintCreate, ComplaintResponse, ComplaintUpdate, 
    AttachmentResponse, AttachmentUploadResponse
)
from app.utils.file_handler import save_upload_file, validate_file, delete_file
import mimetypes

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

@router.post("/", response_model=ComplaintResponse)
async def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """Create a new complaint"""
    # Verify company exists
    company = db.query(Company).filter(Company.id == complaint.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Verify part exists
    part = db.query(Part).filter(Part.id == complaint.part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    db_complaint = Complaint(**complaint.dict())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@router.get("/", response_model=List[ComplaintResponse])
async def get_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get complaints with optional filtering"""
    query = db.query(Complaint).join(Company).join(Part)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    if company_id:
        query = query.filter(Complaint.company_id == company_id)
    
    complaints = query.order_by(desc(Complaint.created_at)).offset(skip).limit(limit).all()
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int,
    complaint_update: ComplaintUpdate,
    db: Session = Depends(get_db)
):
    """Update a complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    update_data = complaint_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(complaint, field, value)
    
    db.commit()
    db.refresh(complaint)
    return complaint

@router.post("/{complaint_id}/attachments", response_model=AttachmentUploadResponse)
async def upload_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload file attachment to a complaint"""
    # Verify complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File too large")
    
    # Reset file pointer
    await file.seek(0)
    
    # Get MIME type
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    
    # Save file
    unique_filename, file_path = await save_upload_file(file, complaint_id)
    
    # Create attachment record
    attachment = ComplaintAttachment(
        complaint_id=complaint_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=mime_type
    )
    
    db.add(attachment)
    
    # Update complaint has_attachments flag
    complaint.has_attachments = True
    
    db.commit()
    db.refresh(attachment)
    
    return attachment

@router.get("/{complaint_id}/attachments", response_model=List[AttachmentResponse])
async def get_attachments(
    complaint_id: int,
    db: Session = Depends(get_db)
):
    """Get all attachments for a complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    attachments = db.query(ComplaintAttachment).filter(
        ComplaintAttachment.complaint_id == complaint_id
    ).all()
    
    return attachments

@router.delete("/attachments/{attachment_id}")
async def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Delete an attachment"""
    attachment = db.query(ComplaintAttachment).filter(
        ComplaintAttachment.id == attachment_id
    ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Delete file from filesystem
    delete_file(attachment.file_path)
    
    # Delete from database
    db.delete(attachment)
    
    # Check if complaint has any remaining attachments
    remaining = db.query(ComplaintAttachment).filter(
        ComplaintAttachment.complaint_id == attachment.complaint_id
    ).count()
    
    if remaining == 0:
        # Update complaint has_attachments flag
        complaint = db.query(Complaint).filter(
            Complaint.id == attachment.complaint_id
        ).first()
        if complaint:
            complaint.has_attachments = False
    
    db.commit()
    return {"message": "Attachment deleted successfully"}