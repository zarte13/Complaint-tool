from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime

from app.database.database import get_db
from app.models.models import (
    FollowUpAction, ActionHistory, ResponsiblePerson, ActionDependency, Complaint
)
from app.schemas.schemas import (
    FollowUpActionCreate, FollowUpActionUpdate, FollowUpActionResponse,
    ResponsiblePersonResponse, ResponsiblePersonCreate, ResponsiblePersonUpdate,
    ActionHistoryResponse, ActionDependencyCreate,
    ActionDependencyResponse, BulkActionUpdate, BulkActionResponse, ActionMetrics,
    ActionStatus, ActionPriority
)

from app.auth.dependencies import get_current_user, require_admin
router = APIRouter(prefix="/api/complaints/{complaint_id}/actions", tags=["follow-up-actions"])

# Helper functions

def create_action_history(
    db: Session, 
    action_id: int, 
    field: str, 
    old_val: Optional[str], 
    new_val: Optional[str], 
    changed_by: str,
    reason: Optional[str] = None
):
    """Create audit trail entry"""
    history = ActionHistory(
        action_id=action_id,
        field_changed=field,
        old_value=old_val,
        new_value=new_val,
        changed_by=changed_by,
        change_reason=reason
    )
    db.add(history)
    db.commit()
    return history

def handle_status_transition(db: Session, action: FollowUpAction, new_status: str):
    """Handle automatic timestamps on status changes"""
    if new_status == "in_progress" and not action.started_at:
        action.started_at = datetime.now()
    elif new_status == "closed" and not action.completed_at:
        action.completed_at = datetime.now()
        action.completion_percentage = 100

def get_next_action_number(db: Session, complaint_id: int) -> int:
    """Get the next action number for a complaint"""
    max_number = db.query(func.max(FollowUpAction.action_number))\
                  .filter(FollowUpAction.complaint_id == complaint_id)\
                  .scalar()
    return (max_number or 0) + 1

def validate_action_dependencies(db: Session, action_id: int, complaint_id: int) -> bool:
    """Check if all dependencies are satisfied for an action to be started"""
    dependencies = db.query(ActionDependency)\
                    .filter(ActionDependency.action_id == action_id)\
                    .all()
    
    for dep in dependencies:
        dependent_action = db.query(FollowUpAction)\
                            .filter(FollowUpAction.id == dep.depends_on_action_id)\
                            .first()
        if dependent_action and dependent_action.status != ActionStatus.CLOSED:
            return False
    return True

# Main endpoints

@router.post("/", response_model=FollowUpActionResponse)
async def create_action(
    action: FollowUpActionCreate,
    complaint_id: int = Path(..., description="Complaint ID"),
    changed_by: str = Query("System", description="Who is creating this action"),
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
):
    """Create a new follow-up action for a complaint"""
    
    try:
        # Validate complaint exists
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Check action limit (max 10 per complaint)
        existing_count = db.query(FollowUpAction)\
                          .filter(FollowUpAction.complaint_id == complaint_id)\
                          .count()
        
        if existing_count >= 10:
            raise HTTPException(
                status_code=400, 
                detail="Maximum of 10 actions per complaint allowed"
            )
        
        # Validate responsible person exists
        person = db.query(ResponsiblePerson)\
                  .filter(and_(
                      ResponsiblePerson.name == action.responsible_person,
                      ResponsiblePerson.is_active == True
                  ))\
                  .first()
        
        if not person:
            raise HTTPException(
                status_code=400, 
                detail=f"Responsible person '{action.responsible_person}' not found or inactive"
            )
        
        # Get next action number
        action_number = get_next_action_number(db, complaint_id)
        
        # Create action
        db_action = FollowUpAction(
            complaint_id=complaint_id,
            action_number=action_number,
            **action.dict()
        )
        
        db.add(db_action)
        db.commit()
        db.refresh(db_action)
        
        # Create audit trail
        create_action_history(
            db, db_action.id, "created", None, 
            f"Action #{action_number} created", changed_by
        )
        
        return db_action
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create action: {str(e)}")

@router.get("/", response_model=List[FollowUpActionResponse])
async def get_actions(
    complaint_id: int = Path(..., description="Complaint ID"),
    status: Optional[ActionStatus] = Query(None, description="Filter by status"),
    responsible_person: Optional[str] = Query(None, description="Filter by responsible person"),
    overdue_only: bool = Query(False, description="Show only overdue actions"),
    db: Session = Depends(get_db)
):
    """Get all follow-up actions for a complaint"""
    
    try:
        # Validate complaint exists
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        query = db.query(FollowUpAction)\
                 .filter(FollowUpAction.complaint_id == complaint_id)
        
        # Apply filters
        if status:
            query = query.filter(FollowUpAction.status == status.value)
        
        if responsible_person:
            query = query.filter(FollowUpAction.responsible_person.ilike(f"%{responsible_person}%"))
        
        if overdue_only:
            today = date.today()
            query = query.filter(
                and_(
                    FollowUpAction.due_date < today,
                    FollowUpAction.status != ActionStatus.CLOSED
                )
            )
        
        actions = query.order_by(FollowUpAction.action_number).all()
        return actions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve actions: {str(e)}")

# Responsible persons endpoints (before parameterized routes)

@router.get("/responsible-persons", response_model=List[ResponsiblePersonResponse])
@router.get("/responsible-persons/", response_model=List[ResponsiblePersonResponse])
async def get_responsible_persons(
    complaint_id: int = Path(..., description="Complaint ID"),
    active_only: bool = Query(True, description="Show only active persons"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),  # authentication required
):
    """Get list of available responsible persons (auth required)"""
    try:
        query = db.query(ResponsiblePerson)
        if active_only:
            query = query.filter(ResponsiblePerson.is_active == True)
        if search:
            like = f"%{search.strip()}%"
            query = query.filter(
                (ResponsiblePerson.name.ilike(like)) | (ResponsiblePerson.email.ilike(like))
            )
        persons = query.order_by(ResponsiblePerson.name).all()
        return persons
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve responsible persons: {str(e)}")

# --- Admin-only Responsible Persons CRUD ---
@router.post("/responsible-persons", response_model=ResponsiblePersonResponse, status_code=status.HTTP_201_CREATED)
async def create_responsible_person(
    payload: ResponsiblePersonCreate,
    complaint_id: int = Path(..., description="Complaint ID (ignored)"),
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    try:
        name = (payload.name or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        exists = db.query(ResponsiblePerson).filter(ResponsiblePerson.name == name).first()
        if exists:
            raise HTTPException(status_code=409, detail="Responsible person with this name already exists")
        person = ResponsiblePerson(
            name=name,
            email=getattr(payload, "email", None),
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


@router.put("/responsible-persons/{person_id}", response_model=ResponsiblePersonResponse)
async def update_responsible_person_admin(
    person_id: int,
    complaint_id: int = Path(..., description="Complaint ID (ignored)"),
    updates: ResponsiblePersonUpdate = None,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    try:
        person = db.query(ResponsiblePerson).filter(ResponsiblePerson.id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Responsible person not found")
        if updates and updates.name is not None:
            name_s = updates.name.strip()
            if not name_s:
                raise HTTPException(status_code=400, detail="Name cannot be empty")
            dup = db.query(ResponsiblePerson).filter(and_(ResponsiblePerson.name == name_s, ResponsiblePerson.id != person_id)).first()
            if dup:
                raise HTTPException(status_code=409, detail="Another person with this name already exists")
            person.name = name_s
        if updates and updates.email is not None:
            person.email = updates.email.strip() or None
        if updates and updates.department is not None:
            person.department = updates.department.strip() or None
        if updates and updates.is_active is not None:
            person.is_active = updates.is_active
        db.add(person)
        db.commit()
        db.refresh(person)
        return person
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update responsible person: {str(e)}")


@router.delete("/responsible-persons/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_responsible_person(
    person_id: int,
    complaint_id: int = Path(..., description="Complaint ID (ignored)"),
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    try:
        person = db.query(ResponsiblePerson).filter(ResponsiblePerson.id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Responsible person not found")
        person.is_active = False
        db.add(person)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate responsible person: {str(e)}")

# Action metrics endpoint

@router.get("/metrics", response_model=ActionMetrics)
@router.get("/metrics/", response_model=ActionMetrics)
async def get_action_metrics(
    complaint_id: int = Path(..., description="Complaint ID"),
    db: Session = Depends(get_db)
):
    """Get action metrics for dashboard"""
    
    try:
        # Validate complaint exists
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        actions = db.query(FollowUpAction)\
                   .filter(FollowUpAction.complaint_id == complaint_id)\
                   .all()
        
        total_actions = len(actions)
        # Treat any non-closed status as open for visibility (open, pending, in_progress, blocked, escalated)
        open_actions = len([a for a in actions if a.status != 'closed'])
        closed_actions = len([a for a in actions if a.status == 'closed'])
        
        # Check for overdue actions
        today = date.today()
        overdue_actions = len([
            a for a in actions 
            if a.due_date and a.due_date < today and a.status != 'closed'
        ])
        
        completion_rate = (closed_actions / total_actions * 100) if total_actions > 0 else 0
        
        # Group by status and priority
        actions_by_status = {}
        actions_by_priority = {}
        
        for action in actions:
            # Status grouping
            status = action.status
            actions_by_status[status] = actions_by_status.get(status, 0) + 1
            
            # Priority grouping
            priority = action.priority
            actions_by_priority[priority] = actions_by_priority.get(priority, 0) + 1
        
        return ActionMetrics(
            total_actions=total_actions,
            open_actions=open_actions,
            overdue_actions=overdue_actions,
            completion_rate=round(completion_rate, 2),
            actions_by_status=actions_by_status,
            actions_by_priority=actions_by_priority
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve metrics: {str(e)}")

@router.get("/{action_id}", response_model=FollowUpActionResponse)
async def get_action(
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    db: Session = Depends(get_db)
):
    """Get a specific follow-up action"""
    
    try:
        action = db.query(FollowUpAction)\
                  .filter(and_(
                      FollowUpAction.id == action_id,
                      FollowUpAction.complaint_id == complaint_id
                  ))\
                  .first()
        
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")
        
        return action
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve action: {str(e)}")

@router.put("/{action_id}", response_model=FollowUpActionResponse)
async def update_action(
    action_update: FollowUpActionUpdate,
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    changed_by: str = Query("System", description="Who is updating this action"),
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
):
    """Update a follow-up action"""
    
    try:
        db_action = db.query(FollowUpAction)\
                     .filter(and_(
                         FollowUpAction.id == action_id,
                         FollowUpAction.complaint_id == complaint_id
                     ))\
                     .first()
        
        if not db_action:
            raise HTTPException(status_code=404, detail="Action not found")
        
        # Track changes for audit
        changes = {}
        update_data = action_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_action, field):
                old_value = getattr(db_action, field)
                if old_value != value:
                    changes[field] = (old_value, value)
                    setattr(db_action, field, value)
        
        # Handle status transitions
        if 'status' in changes:
            handle_status_transition(db, db_action, changes['status'][1])
        
        # Validate responsible person if changed
        if 'responsible_person' in changes:
            person = db.query(ResponsiblePerson)\
                      .filter(and_(
                          ResponsiblePerson.name == changes['responsible_person'][1],
                          ResponsiblePerson.is_active == True
                      ))\
                      .first()
            
            if not person:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Responsible person '{changes['responsible_person'][1]}' not found or inactive"
                )
        
        if changes:
            db.commit()
            db.refresh(db_action)
            
            # Create audit trail for each change
            for field, (old_val, new_val) in changes.items():
                create_action_history(
                    db, action_id, field, 
                    str(old_val) if old_val is not None else None, 
                    str(new_val) if new_val is not None else None, 
                    changed_by
                )
        
        return db_action
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update action: {str(e)}")

@router.delete("/{action_id}")
async def delete_action(
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    changed_by: str = Query("System", description="Who is deleting this action"),
    db: Session = Depends(get_db)
):
    """Delete a follow-up action (soft delete by marking as cancelled)"""
    
    try:
        db_action = db.query(FollowUpAction)\
                     .filter(and_(
                         FollowUpAction.id == action_id,
                         FollowUpAction.complaint_id == complaint_id
                     ))\
                     .first()
        
        if not db_action:
            raise HTTPException(status_code=404, detail="Action not found")
        
        # Soft delete by changing status to a special status
        old_status = db_action.status
        db_action.status = "cancelled"
        
        db.commit()
        
        create_action_history(
            db, action_id, "status", old_status, "cancelled", changed_by, "Action deleted"
        )
        
        return {"message": "Action cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete action: {str(e)}")

@router.post("/{action_id}/reorder")
async def reorder_actions(
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    new_position: int = Query(..., ge=1, le=10, description="New position (1-10)"),
    changed_by: str = Query("System", description="Who is reordering actions"),
    db: Session = Depends(get_db)
):
    """Reorder actions using drag and drop"""
    
    try:
        # Get the action to reorder
        action_to_move = db.query(FollowUpAction)\
                          .filter(and_(
                              FollowUpAction.id == action_id,
                              FollowUpAction.complaint_id == complaint_id
                          ))\
                          .first()
        
        if not action_to_move:
            raise HTTPException(status_code=404, detail="Action not found")
        
        # Get all actions for this complaint
        all_actions = db.query(FollowUpAction)\
                       .filter(FollowUpAction.complaint_id == complaint_id)\
                       .order_by(FollowUpAction.action_number)\
                       .all()
        
        # Validate new position
        if new_position > len(all_actions):
            raise HTTPException(status_code=400, detail="Invalid position")
        
        # Reorder logic (simplified - just swap action numbers)
        old_position = action_to_move.action_number
        
        if old_position != new_position:
            # Update action numbers
            if old_position < new_position:
                # Moving down: shift actions up
                for action in all_actions:
                    if old_position < action.action_number <= new_position:
                        action.action_number -= 1
            else:
                # Moving up: shift actions down
                for action in all_actions:
                    if new_position <= action.action_number < old_position:
                        action.action_number += 1
            
            action_to_move.action_number = new_position
            
            db.commit()
            
            create_action_history(
                db, action_id, "action_number", 
                str(old_position), str(new_position), changed_by, "Action reordered"
            )
        
        return {"message": f"Action moved from position {old_position} to {new_position}"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reorder action: {str(e)}")

# History and audit endpoints

@router.get("/{action_id}/history", response_model=List[ActionHistoryResponse])
async def get_action_history(
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    db: Session = Depends(get_db)
):
    """Get audit trail for a specific action"""
    
    try:
        # Verify action exists
        action = db.query(FollowUpAction)\
                  .filter(and_(
                      FollowUpAction.id == action_id,
                      FollowUpAction.complaint_id == complaint_id
                  ))\
                  .first()
        
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")
        
        history = db.query(ActionHistory)\
                   .filter(ActionHistory.action_id == action_id)\
                   .order_by(ActionHistory.changed_at.desc())\
                   .all()
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve action history: {str(e)}")

# Bulk operations

@router.patch("/bulk-update", response_model=BulkActionResponse)
async def bulk_update_actions(
    bulk_update: BulkActionUpdate,
    complaint_id: int = Path(..., description="Complaint ID"),
    changed_by: str = Query("System", description="Who is performing bulk update"),
    db: Session = Depends(get_db)
):
    """Bulk update multiple actions"""
    
    try:
        updated_count = 0
        failed_updates = []
        
        for action_id in bulk_update.action_ids:
            try:
                action = db.query(FollowUpAction)\
                          .filter(and_(
                              FollowUpAction.id == action_id,
                              FollowUpAction.complaint_id == complaint_id
                          ))\
                          .first()
                
                if not action:
                    failed_updates.append({
                        "action_id": action_id,
                        "error": "Action not found"
                    })
                    continue
                
                # Apply updates
                update_data = bulk_update.updates.dict(exclude_unset=True)
                for field, value in update_data.items():
                    if hasattr(action, field):
                        old_value = getattr(action, field)
                        if old_value != value:
                            setattr(action, field, value)
                            create_action_history(
                                db, action_id, field, 
                                str(old_value) if old_value is not None else None,
                                str(value) if value is not None else None,
                                changed_by, "Bulk update"
                            )
                
                updated_count += 1
                
            except Exception as e:
                failed_updates.append({
                    "action_id": action_id,
                    "error": str(e)
                })
        
        if updated_count > 0:
            db.commit()
        
        return BulkActionResponse(
            updated_count=updated_count,
            failed_updates=failed_updates
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to perform bulk update: {str(e)}")

# Dependencies endpoints

@router.post("/{action_id}/dependencies", response_model=ActionDependencyResponse)
async def create_dependency(
    dependency: ActionDependencyCreate,
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    db: Session = Depends(get_db)
):
    """Create a dependency between actions"""
    
    try:
        # Validate both actions exist
        action = db.query(FollowUpAction)\
                  .filter(and_(
                      FollowUpAction.id == action_id,
                      FollowUpAction.complaint_id == complaint_id
                  ))\
                  .first()
        
        depends_on_action = db.query(FollowUpAction)\
                             .filter(and_(
                                 FollowUpAction.id == dependency.depends_on_action_id,
                                 FollowUpAction.complaint_id == complaint_id
                             ))\
                             .first()
        
        if not action or not depends_on_action:
            raise HTTPException(status_code=404, detail="One or both actions not found")
        
        # Prevent circular dependencies
        existing_dep = db.query(ActionDependency)\
                        .filter(and_(
                            ActionDependency.action_id == dependency.depends_on_action_id,
                            ActionDependency.depends_on_action_id == action_id
                        ))\
                        .first()
        
        if existing_dep:
            raise HTTPException(status_code=400, detail="Circular dependency detected")
        
        # Create dependency
        db_dependency = ActionDependency(
            action_id=action_id,
            **dependency.dict()
        )
        
        db.add(db_dependency)
        db.commit()
        db.refresh(db_dependency)
        
        return db_dependency
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create dependency: {str(e)}")

@router.get("/{action_id}/dependencies", response_model=List[ActionDependencyResponse])
async def get_action_dependencies(
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    db: Session = Depends(get_db)
):
    """Get dependencies for a specific action"""
    
    try:
        # Verify action exists
        action = db.query(FollowUpAction)\
                  .filter(and_(
                      FollowUpAction.id == action_id,
                      FollowUpAction.complaint_id == complaint_id
                  ))\
                  .first()
        
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")
        
        dependencies = db.query(ActionDependency)\
                        .filter(ActionDependency.action_id == action_id)\
                        .all()
        
        return dependencies
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dependencies: {str(e)}")

@router.post("/{action_id}/start")
async def start_action(
    complaint_id: int = Path(..., description="Complaint ID"),
    action_id: int = Path(..., description="Action ID"),
    changed_by: str = Query("System", description="Who is starting this action"),
    db: Session = Depends(get_db)
):
    """Start an action if dependencies are satisfied"""
    
    try:
        action = db.query(FollowUpAction)\
                  .filter(and_(
                      FollowUpAction.id == action_id,
                      FollowUpAction.complaint_id == complaint_id
                  ))\
                  .first()
        
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")
        
        if action.status != ActionStatus.OPEN:
            raise HTTPException(status_code=400, detail="Action can only be started from 'open' status")
        
        # Check dependencies
        if not validate_action_dependencies(db, action_id, complaint_id):
            raise HTTPException(
                status_code=400, 
                detail="Cannot start action: dependencies not satisfied"
            )
        
        # Update status
        old_status = action.status
        action.status = ActionStatus.IN_PROGRESS
        handle_status_transition(db, action, ActionStatus.IN_PROGRESS)
        
        db.commit()
        
        create_action_history(
            db, action_id, "status", old_status, ActionStatus.IN_PROGRESS, 
            changed_by, "Action started"
        )
        
        return {"message": "Action started successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start action: {str(e)}") 