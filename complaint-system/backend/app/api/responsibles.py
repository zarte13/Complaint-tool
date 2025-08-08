from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database.database import get_db
from app.models.models import ResponsiblePerson
from app.schemas.schemas import (
    ResponsiblePersonCreate,
    ResponsiblePersonResponse,
    ResponsiblePersonUpdate,
)
from app.auth.dependencies import get_current_user, require_admin


router = APIRouter(prefix="/api/responsible-persons", tags=["responsibles"])


# Accept both "" and "/" for collection GET to avoid 307 redirects
@router.get("", response_model=List[ResponsiblePersonResponse])
@router.get("/", response_model=List[ResponsiblePersonResponse])
async def list_responsible_persons(
    search: Optional[str] = Query(None, description="Search by name or email"),
    active_only: bool = Query(True, description="Show only active persons"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
):
    try:
        query = db.query(ResponsiblePerson)

        if active_only:
            query = query.filter(ResponsiblePerson.is_active == True)

        if search:
            s = f"%{search}%"
            query = query.filter(
                or_(ResponsiblePerson.name.ilike(s), ResponsiblePerson.email.ilike(s))
            )

        persons = query.order_by(ResponsiblePerson.name.asc()).limit(limit).all()
        return persons
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve responsible persons: {str(e)}")


# Accept both "" and "/" for collection POST
@router.post("", response_model=ResponsiblePersonResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ResponsiblePersonResponse, status_code=status.HTTP_201_CREATED)
async def create_responsible_person(
    payload: ResponsiblePersonCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    try:
        name = (payload.name or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        # Unique by name
        exists = db.query(ResponsiblePerson).filter(ResponsiblePerson.name == name).first()
        if exists:
            raise HTTPException(status_code=409, detail="Responsible person with this name already exists")
        person = ResponsiblePerson(
            name=name,
            email=(payload.email or None),
            department=getattr(payload, "department", None),
            is_active=True,
        )
        db.add(person)
        db.commit()
        db.refresh(person)
        return person
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create responsible person: {str(e)}")


@router.put("/{person_id}", response_model=ResponsiblePersonResponse)
async def update_responsible_person(
    person_id: int = Path(..., description="Responsible person ID"),
    updates: ResponsiblePersonUpdate = None,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    try:
        person = db.query(ResponsiblePerson).filter(ResponsiblePerson.id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Responsible person not found")

        if updates is not None:
            if updates.name is not None:
                new_name = updates.name.strip()
                if not new_name:
                    raise HTTPException(status_code=400, detail="Name cannot be empty")
                # Check for name conflict
                dup = (
                    db.query(ResponsiblePerson)
                    .filter(and_(ResponsiblePerson.name == new_name, ResponsiblePerson.id != person_id))
                    .first()
                )
                if dup:
                    raise HTTPException(status_code=409, detail="Another person with this name already exists")
                person.name = new_name

            if updates.email is not None:
                person.email = updates.email.strip() or None

            if updates.department is not None:
                person.department = updates.department.strip() or None

            if updates.is_active is not None:
                person.is_active = updates.is_active

        db.add(person)
        db.commit()
        db.refresh(person)
        return person
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update responsible person: {str(e)}")


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_responsible_person(
    person_id: int,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    try:
        person = db.query(ResponsiblePerson).filter(ResponsiblePerson.id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Responsible person not found")
        if not person.is_active:
            # Idempotent
            return
        person.is_active = False
        db.add(person)
        db.commit()
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate responsible person: {str(e)}")


