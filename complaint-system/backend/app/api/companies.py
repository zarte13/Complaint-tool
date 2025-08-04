from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Company
from app.schemas.schemas import CompanyResponse, CompanyCreate

router = APIRouter(prefix="/api/companies", tags=["companies"])
# Register alias routes to support both "/api/companies" and "/api/companies/" without 307 redirects

# Accept both "" and "/" for collection GET
@router.get("", response_model=List[CompanyResponse])
@router.get("/", response_model=List[CompanyResponse])
async def search_companies(
    search: str = Query(None, min_length=1, max_length=100),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search companies by name"""
    query = db.query(Company)
    
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%"))
    
    companies = query.order_by(Company.name).limit(limit).all()
    return companies

# Accept both "" and "/" for collection POST
@router.post("", response_model=CompanyResponse)
@router.post("/", response_model=CompanyResponse)
async def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db)
):
    """Create a new company"""
    # Check if company already exists
    existing = db.query(Company).filter(Company.name.ilike(company.name)).first()
    if existing:
        return existing
    
    db_company = Company(name=company.name)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@router.get("/all", response_model=List[CompanyResponse])
async def get_all_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all companies with pagination"""
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies