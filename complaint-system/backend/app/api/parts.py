from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Part
from app.schemas.schemas import PartResponse, PartCreate

router = APIRouter(prefix="/api/parts", tags=["parts"])

@router.get("/", response_model=List[PartResponse])
async def search_parts(
    search: str = Query(None, min_length=1, max_length=100),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search parts by part number or description"""
    query = db.query(Part)
    
    if search:
        query = query.filter(
            Part.part_number.ilike(f"%{search}%") | 
            Part.description.ilike(f"%{search}%")
        )
    
    parts = query.order_by(Part.part_number).limit(limit).all()
    return parts

@router.post("/", response_model=PartResponse)
async def create_part(
    part: PartCreate,
    db: Session = Depends(get_db)
):
    """Create a new part"""
    # Check if part already exists
    existing = db.query(Part).filter(Part.part_number.ilike(part.part_number)).first()
    if existing:
        return existing
    
    db_part = Part(part_number=part.part_number, description=part.description)
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@router.get("/all", response_model=List[PartResponse])
async def get_all_parts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all parts with pagination"""
    parts = db.query(Part).offset(skip).limit(limit).all()
    return parts