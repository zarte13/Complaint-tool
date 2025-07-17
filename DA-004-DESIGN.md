# DA-004: Follow-up Actions Module - Complete Design

## 📊 Executive Summary

Based on the French action plan format (Cause(s) et Plan d'action) and your requirements, DA-004 implements a comprehensive follow-up actions system for complaint management with sequential workflows, individual assignments, and email notifications.

## 🎯 Requirements Analysis

### Scale & Capacity
- **Max Actions per Complaint**: 10 (typical: 2-3)
- **Concurrent Users**: Few, one person per action step
- **Data Retention**: Forever (no deletion)

### Workflow States
- **open**: Newly created, ready to start
- **pending**: Waiting for external input
- **in_progress**: Currently being worked on
- **blocked**: Cannot proceed due to dependency
- **escalated**: Requires management intervention
- **closed**: Successfully completed

### Business Rules
- **Assignment**: Individuals only (no teams)
- **Dependencies**: Sequential order (1→2→3→4)
- **Authentication**: Manual name selection from list
- **Notifications**: Email only (for now)
- **Reporting**: Dashboard integration

---

## 🗄️ Database Schema Design

### New Tables

#### 1. follow_up_actions
```sql
CREATE TABLE follow_up_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    action_number INTEGER NOT NULL,  -- Sequential: 1, 2, 3, 4...
    action_text TEXT NOT NULL,
    responsible_person VARCHAR(255) NOT NULL,  -- Manual entry from list
    due_date DATE,
    status VARCHAR(20) DEFAULT 'open',  -- open, pending, in_progress, blocked, escalated, closed
    priority VARCHAR(10) DEFAULT 'medium',  -- low, medium, high, critical
    notes TEXT,
    completion_percentage INTEGER DEFAULT 0,  -- 0-100
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    UNIQUE(complaint_id, action_number)  -- Ensures sequential numbering
);
```

#### 2. action_history (Audit Trail)
```sql
CREATE TABLE action_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,
    FOREIGN KEY (action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE
);
```

#### 3. responsible_persons (Name List)
```sql
CREATE TABLE responsible_persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. action_dependencies
```sql
CREATE TABLE action_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    depends_on_action_id INTEGER NOT NULL,
    dependency_type VARCHAR(20) DEFAULT 'sequential',  -- sequential, blocking, optional
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE
);
```

### Database Indexes
```sql
CREATE INDEX idx_actions_complaint_id ON follow_up_actions(complaint_id);
CREATE INDEX idx_actions_status ON follow_up_actions(status);
CREATE INDEX idx_actions_responsible ON follow_up_actions(responsible_person);
CREATE INDEX idx_actions_due_date ON follow_up_actions(due_date);
CREATE INDEX idx_history_action_id ON action_history(action_id);
```

---

## 🎨 UI/UX Design

### Integration with Complaint Detail Drawer

Based on the French action plan format, the actions section will be added to the existing Enhanced Complaint Detail Drawer:

```
┌─ Enhanced Complaint Detail Drawer ─────────────────────────────┐
│ LEFT COLUMN          │ RIGHT COLUMN                            │
│ ┌─ Basic Info ─┐     │ ┌─ Additional Info ──────────────────┐ │
│ │ Company      │     │ │ Work Order, Occurrence, etc.      │ │
│ │ Part Number  │     │ │                                    │ │
│ │ Issue Type   │     │ └────────────────────────────────────┘ │
│ └──────────────┘     │                                        │
│                      │ ┌─ Description ──────────────────────┐ │
│ ┌─ Image Gallery─┐   │ │ Detailed description text...       │ │
│ │ [img] [img]    │   │ │                                    │ │
│ │ [img] [img]    │   │ └────────────────────────────────────┘ │
│ └────────────────┘   │                                        │
│                      │ ┌─ FOLLOW-UP ACTIONS ────────────────┐ │
│ ┌─ File Attachments─┐ │ │ ┌─ Action #1 ─────────────────────┐ │ │
│ │ 📄 file1.pdf     │ │ │ │ □ Corriger des erreurs...        │ │ │
│ │ 📷 image1.jpg    │ │ │ │ 👤 AL    📅 2022-01-21  🟡 Open  │ │ │
│ └──────────────────┘ │ │ └──────────────────────────────────┘ │ │
│                      │ │ ┌─ Action #2 ─────────────────────┐ │ │
│                      │ │ │ □ Formation des employés         │ │ │
│                      │ │ │ 👤 JF    📅 2022-01-28  ✅ Done  │ │ │
│                      │ │ └──────────────────────────────────┘ │ │
│                      │ │ [+ Add Action]                      │ │ │
│                      │ └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Action Card Design
```typescript
interface ActionCardProps {
  action: FollowUpAction;
  isEditable: boolean;
  onUpdate: (updates: Partial<FollowUpAction>) => void;
  onDelete: (id: number) => void;
}

// Visual states based on French format:
// ✅ Completed (green checkmark)
// 🟡 In Progress (yellow circle)
// 🔴 Overdue (red circle)
// ⏸️ Blocked (pause icon)
// 🔥 Escalated (fire icon)
```

### Responsive Breakpoints
- **Mobile (< 768px)**: Single column, stacked actions
- **Tablet (768px-1024px)**: Condensed two-column
- **Desktop (> 1024px)**: Full two-column with action panel

---

## ⚙️ Backend Implementation

### 1. SQLAlchemy Models

```python
# app/models/models.py

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
    notes = Column(Text)
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
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
    old_value = Column(Text)
    new_value = Column(Text)
    changed_by = Column(String(255), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    change_reason = Column(Text)
    
    action = relationship("FollowUpAction", back_populates="history")

class ResponsiblePerson(Base):
    __tablename__ = "responsible_persons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    email = Column(String(255))
    department = Column(String(100))
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

# Update Complaint model
class Complaint(Base):
    # ... existing fields ...
    follow_up_actions = relationship("FollowUpAction", back_populates="complaint", cascade="all, delete-orphan")
```

### 2. Pydantic Schemas

```python
# app/schemas/schemas.py

class FollowUpActionCreate(BaseModel):
    action_text: str = Field(..., min_length=5, max_length=500)
    responsible_person: str = Field(..., min_length=2, max_length=255)
    due_date: Optional[date] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    notes: Optional[str] = Field(None, max_length=1000)

class FollowUpActionUpdate(BaseModel):
    action_text: Optional[str] = Field(None, min_length=5, max_length=500)
    responsible_person: Optional[str] = Field(None, min_length=2, max_length=255)
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(open|pending|in_progress|blocked|escalated|closed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    notes: Optional[str] = Field(None, max_length=1000)
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)

class FollowUpActionResponse(BaseModel):
    id: int
    complaint_id: int
    action_number: int
    action_text: str
    responsible_person: str
    due_date: Optional[date]
    status: str
    priority: str
    notes: Optional[str]
    completion_percentage: int
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    is_overdue: bool = Field(..., computed=True)
    can_start: bool = Field(..., computed=True)  # Based on dependencies
    
    @computed_field
    @property
    def is_overdue(self) -> bool:
        if self.due_date and self.status not in ['closed']:
            return date.today() > self.due_date
        return False
    
    @computed_field
    @property
    def can_start(self) -> bool:
        # Logic to check if dependencies are met
        return True  # Placeholder

class ResponsiblePersonResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    department: Optional[str]
    is_active: bool

# Update ComplaintResponse to include actions
class ComplaintResponse(BaseModel):
    # ... existing fields ...
    follow_up_actions: List[FollowUpActionResponse] = []
```

### 3. API Endpoints

```python
# app/api/follow_up_actions.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

router = APIRouter(prefix="/api/complaints/{complaint_id}/actions", tags=["follow-up-actions"])

@router.post("/", response_model=FollowUpActionResponse)
async def create_action(
    complaint_id: int,
    action: FollowUpActionCreate,
    db: Session = Depends(get_db)
):
    """Create a new follow-up action for a complaint"""
    # Validate complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Get next action number
    max_action_number = db.query(func.max(FollowUpAction.action_number))\
                         .filter(FollowUpAction.complaint_id == complaint_id)\
                         .scalar() or 0
    
    db_action = FollowUpAction(
        complaint_id=complaint_id,
        action_number=max_action_number + 1,
        **action.dict()
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    
    # Create audit trail
    create_action_history(db, db_action.id, "created", None, "Action created", "System")
    
    return db_action

@router.get("/", response_model=List[FollowUpActionResponse])
async def get_actions(
    complaint_id: int,
    db: Session = Depends(get_db)
):
    """Get all follow-up actions for a complaint"""
    actions = db.query(FollowUpAction)\
               .filter(FollowUpAction.complaint_id == complaint_id)\
               .order_by(FollowUpAction.action_number)\
               .all()
    return actions

@router.put("/{action_id}", response_model=FollowUpActionResponse)
async def update_action(
    complaint_id: int,
    action_id: int,
    action_update: FollowUpActionUpdate,
    changed_by: str = "System",  # TODO: Get from auth system
    db: Session = Depends(get_db)
):
    """Update a follow-up action"""
    db_action = db.query(FollowUpAction)\
                 .filter(FollowUpAction.id == action_id, 
                        FollowUpAction.complaint_id == complaint_id)\
                 .first()
    
    if not db_action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Track changes for audit
    changes = {}
    for field, value in action_update.dict(exclude_unset=True).items():
        old_value = getattr(db_action, field)
        if old_value != value:
            changes[field] = (old_value, value)
            setattr(db_action, field, value)
    
    # Handle status transitions
    if 'status' in changes:
        handle_status_transition(db_action, changes['status'][1])
    
    db.commit()
    db.refresh(db_action)
    
    # Create audit trail for each change
    for field, (old_val, new_val) in changes.items():
        create_action_history(db, action_id, field, str(old_val), str(new_val), changed_by)
    
    return db_action

@router.delete("/{action_id}")
async def delete_action(
    complaint_id: int,
    action_id: int,
    db: Session = Depends(get_db)
):
    """Delete a follow-up action (soft delete by marking as cancelled)"""
    db_action = db.query(FollowUpAction)\
                 .filter(FollowUpAction.id == action_id, 
                        FollowUpAction.complaint_id == complaint_id)\
                 .first()
    
    if not db_action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Soft delete by changing status
    db_action.status = "cancelled"
    db.commit()
    
    create_action_history(db, action_id, "status", db_action.status, "cancelled", "System")
    
    return {"message": "Action cancelled successfully"}

@router.post("/{action_id}/reorder")
async def reorder_actions(
    complaint_id: int,
    action_id: int,
    new_position: int,
    db: Session = Depends(get_db)
):
    """Reorder actions using drag and drop"""
    # Implementation for drag-drop reordering
    pass

# Responsible persons endpoints
@router.get("/responsible-persons", response_model=List[ResponsiblePersonResponse])
async def get_responsible_persons(db: Session = Depends(get_db)):
    """Get list of available responsible persons"""
    return db.query(ResponsiblePerson)\
            .filter(ResponsiblePerson.is_active == True)\
            .order_by(ResponsiblePerson.name)\
            .all()

def handle_status_transition(action: FollowUpAction, new_status: str):
    """Handle automatic timestamps on status changes"""
    if new_status == "in_progress" and not action.started_at:
        action.started_at = func.now()
    elif new_status == "closed" and not action.completed_at:
        action.completed_at = func.now()
        action.completion_percentage = 100

def create_action_history(db: Session, action_id: int, field: str, old_val: str, new_val: str, changed_by: str):
    """Create audit trail entry"""
    history = ActionHistory(
        action_id=action_id,
        field_changed=field,
        old_value=old_val,
        new_value=new_val,
        changed_by=changed_by
    )
    db.add(history)
    db.commit()
```

---

## 🎨 Frontend Implementation

### 1. TypeScript Interfaces

```typescript
// src/types/index.ts

export interface FollowUpAction {
  id: number;
  complaint_id: number;
  action_number: number;
  action_text: string;
  responsible_person: string;
  due_date?: string;  // ISO date string
  status: 'open' | 'pending' | 'in_progress' | 'blocked' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  is_overdue: boolean;
  can_start: boolean;
}

export interface ResponsiblePerson {
  id: number;
  name: string;
  email?: string;
  department?: string;
  is_active: boolean;
}

// Update existing Complaint interface
export interface Complaint {
  // ... existing fields ...
  follow_up_actions: FollowUpAction[];
}
```

### 2. React Components

```typescript
// src/components/FollowUpActions/FollowUpActionsPanel.tsx

import React, { useState, useEffect } from 'react';
import { FollowUpAction, ResponsiblePerson } from '../../types';
import { ActionCard } from './ActionCard';
import { AddActionForm } from './AddActionForm';
import { useFollowUpActions } from '../../hooks/useFollowUpActions';

interface FollowUpActionsPanelProps {
  complaintId: number;
  isEditable: boolean;
}

export const FollowUpActionsPanel: React.FC<FollowUpActionsPanelProps> = ({
  complaintId,
  isEditable
}) => {
  const {
    actions,
    responsiblePersons,
    isLoading,
    createAction,
    updateAction,
    deleteAction,
    reorderActions
  } = useFollowUpActions(complaintId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedAction, setDraggedAction] = useState<FollowUpAction | null>(null);

  const handleDragStart = (action: FollowUpAction) => {
    setDraggedAction(action);
  };

  const handleDrop = (targetAction: FollowUpAction) => {
    if (draggedAction && draggedAction.id !== targetAction.id) {
      reorderActions(draggedAction.id, targetAction.action_number);
    }
    setDraggedAction(null);
  };

  return (
    <div className="follow-up-actions-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Actions de Suivi ({actions.length})
        </h3>
        {isEditable && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm"
            disabled={actions.length >= 10}  // Max 10 actions
          >
            + Ajouter une Action
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              isEditable={isEditable}
              onUpdate={(updates) => updateAction(action.id, updates)}
              onDelete={() => deleteAction(action.id)}
              onDragStart={() => handleDragStart(action)}
              onDrop={() => handleDrop(action)}
              isDragging={draggedAction?.id === action.id}
              responsiblePersons={responsiblePersons}
            />
          ))}
          
          {actions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune action de suivi</p>
              {isEditable && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Créer la première action
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showAddForm && (
        <AddActionForm
          complaintId={complaintId}
          actionNumber={actions.length + 1}
          responsiblePersons={responsiblePersons}
          onSubmit={(actionData) => {
            createAction(actionData);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
};
```

```typescript
// src/components/FollowUpActions/ActionCard.tsx

import React, { useState } from 'react';
import { FollowUpAction, ResponsiblePerson } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActionCardProps {
  action: FollowUpAction;
  isEditable: boolean;
  onUpdate: (updates: Partial<FollowUpAction>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  isDragging: boolean;
  responsiblePersons: ResponsiblePerson[];
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  isEditable,
  onUpdate,
  onDelete,
  onDragStart,
  onDrop,
  isDragging,
  responsiblePersons
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(action);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed': return '✅';
      case 'in_progress': return '🟡';
      case 'blocked': return '⏸️';
      case 'escalated': return '🔥';
      case 'open': return '⚪';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      case 'escalated': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const isOverdue = action.is_overdue;
    return (
      <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
        📅 {date.toLocaleDateString('fr-FR')}
        {isOverdue && ' (En retard)'}
      </span>
    );
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-200 ${
        isDragging ? 'opacity-50 transform scale-95' : 'opacity-100'
      } ${action.is_overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
      draggable={isEditable}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Action Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon(action.status)}</span>
          <span className="text-sm font-medium text-gray-600">
            Action #{action.action_number}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(action.status)}`}>
            {action.status.toUpperCase()}
          </span>
        </div>
        
        {isEditable && (
          <div className="flex space-x-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Action Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editData.action_text}
            onChange={(e) => setEditData({...editData, action_text: e.target.value})}
            className="w-full p-2 border rounded resize-none"
            rows={2}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <select
              value={editData.responsible_person}
              onChange={(e) => setEditData({...editData, responsible_person: e.target.value})}
              className="p-2 border rounded"
            >
              {responsiblePersons.map((person) => (
                <option key={person.id} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>
            
            <input
              type="date"
              value={editData.due_date || ''}
              onChange={(e) => setEditData({...editData, due_date: e.target.value})}
              className="p-2 border rounded"
            />
          </div>
          
          <div className="flex space-x-2">
            <button onClick={handleSave} className="btn-primary text-sm">
              Sauvegarder
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="btn-secondary text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-900 mb-2">{action.action_text}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                👤 {action.responsible_person}
              </span>
              {formatDueDate(action.due_date)}
            </div>
            
            {action.completion_percentage > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{width: `${action.completion_percentage}%`}}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {action.completion_percentage}%
                </span>
              </div>
            )}
          </div>
          
          {action.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
              💬 {action.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 3. Custom Hooks

```typescript
// src/hooks/useFollowUpActions.ts

import { useState, useEffect } from 'react';
import { FollowUpAction, ResponsiblePerson } from '../types';
import { api } from '../services/api';

export const useFollowUpActions = (complaintId: number) => {
  const [actions, setActions] = useState<FollowUpAction[]>([]);
  const [responsiblePersons, setResponsiblePersons] = useState<ResponsiblePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [complaintId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [actionsResponse, personsResponse] = await Promise.all([
        api.get(`/complaints/${complaintId}/actions/`),
        api.get(`/complaints/${complaintId}/actions/responsible-persons`)
      ]);
      
      setActions(actionsResponse.data);
      setResponsiblePersons(personsResponse.data);
    } catch (err) {
      setError('Failed to load actions');
      console.error('Error loading actions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAction = async (actionData: Partial<FollowUpAction>) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/actions/`, actionData);
      setActions(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Failed to create action');
      throw err;
    }
  };

  const updateAction = async (actionId: number, updates: Partial<FollowUpAction>) => {
    try {
      const response = await api.put(`/complaints/${complaintId}/actions/${actionId}`, updates);
      setActions(prev => prev.map(action => 
        action.id === actionId ? response.data : action
      ));
      return response.data;
    } catch (err) {
      setError('Failed to update action');
      throw err;
    }
  };

  const deleteAction = async (actionId: number) => {
    try {
      await api.delete(`/complaints/${complaintId}/actions/${actionId}`);
      setActions(prev => prev.filter(action => action.id !== actionId));
    } catch (err) {
      setError('Failed to delete action');
      throw err;
    }
  };

  const reorderActions = async (actionId: number, newPosition: number) => {
    try {
      await api.post(`/complaints/${complaintId}/actions/${actionId}/reorder`, {
        new_position: newPosition
      });
      await loadData(); // Reload to get updated order
    } catch (err) {
      setError('Failed to reorder actions');
      throw err;
    }
  };

  return {
    actions,
    responsiblePersons,
    isLoading,
    error,
    createAction,
    updateAction,
    deleteAction,
    reorderActions,
    reload: loadData
  };
};
```

---

## 🔧 Integration with Existing System

### 1. Update Enhanced Complaint Detail Drawer

```typescript
// src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx

import { FollowUpActionsPanel } from '../FollowUpActions/FollowUpActionsPanel';

// Add to the right column after description
<div className="space-y-6">
  {/* Description section */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {t('details')}
    </label>
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-900 whitespace-pre-wrap">{complaint.details}</p>
    </div>
  </div>

  {/* Follow-up Actions section */}
  <FollowUpActionsPanel
    complaintId={complaint.id}
    isEditable={isEditing}
  />
</div>
```

### 2. Dashboard Updates

```typescript
// Add to DashboardPage analytics
const actionMetrics = {
  totalActions: 156,
  openActions: 23,
  overdueActions: 8,
  completionRate: 89.2
};

// Add to dashboard widgets
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-4">Actions de Suivi</h3>
  <div className="space-y-3">
    <div className="flex justify-between">
      <span>Actions Ouvertes</span>
      <span className="font-medium">{actionMetrics.openActions}</span>
    </div>
    <div className="flex justify-between">
      <span>En Retard</span>
      <span className="font-medium text-red-600">{actionMetrics.overdueActions}</span>
    </div>
    <div className="flex justify-between">
      <span>Taux de Completion</span>
      <span className="font-medium text-green-600">{actionMetrics.completionRate}%</span>
    </div>
  </div>
</div>
```

---

## 📧 Email Notification System

### 1. Backend Email Service

```python
# app/services/email_service.py

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME="your-email@company.com",
            MAIL_PASSWORD="your-password",
            MAIL_FROM="noreply@company.com",
            MAIL_PORT=587,
            MAIL_SERVER="smtp.company.com",
            MAIL_TLS=True,
            MAIL_SSL=False
        )
        self.fm = FastMail(self.conf)

    async def send_action_assignment(self, action: FollowUpAction, responsible_email: str):
        """Send email when action is assigned"""
        message = MessageSchema(
            subject=f"Nouvelle Action Assignée - Réclamation #{action.complaint_id}",
            recipients=[responsible_email],
            body=f"""
            Bonjour,
            
            Une nouvelle action vous a été assignée:
            
            Action #{action.action_number}: {action.action_text}
            Réclamation: #{action.complaint_id}
            Date d'échéance: {action.due_date or 'Non définie'}
            Priorité: {action.priority}
            
            Veuillez vous connecter au système pour plus de détails.
            
            Cordialement,
            Système de Gestion des Réclamations
            """,
            subtype="plain"
        )
        await self.fm.send_message(message)

    async def send_overdue_reminder(self, actions: List[FollowUpAction], responsible_email: str):
        """Send reminder for overdue actions"""
        action_list = "\n".join([f"- Action #{a.action_number}: {a.action_text}" for a in actions])
        
        message = MessageSchema(
            subject=f"Rappel: {len(actions)} Action(s) En Retard",
            recipients=[responsible_email],
            body=f"""
            Bonjour,
            
            Les actions suivantes sont en retard:
            
            {action_list}
            
            Veuillez prendre les mesures nécessaires.
            
            Cordialement,
            Système de Gestion des Réclamations
            """,
            subtype="plain"
        )
        await self.fm.send_message(message)
```

### 2. Background Tasks for Notifications

```python
# app/tasks/notification_tasks.py

from celery import Celery
from datetime import date, timedelta

app = Celery('notifications')

@app.task
def send_daily_overdue_reminders():
    """Daily task to send overdue action reminders"""
    db = SessionLocal()
    try:
        overdue_actions = db.query(FollowUpAction)\
                          .filter(FollowUpAction.due_date < date.today())\
                          .filter(FollowUpAction.status.in_(['open', 'in_progress']))\
                          .all()
        
        # Group by responsible person
        actions_by_person = {}
        for action in overdue_actions:
            if action.responsible_person not in actions_by_person:
                actions_by_person[action.responsible_person] = []
            actions_by_person[action.responsible_person].append(action)
        
        email_service = EmailService()
        for person, actions in actions_by_person.items():
            # Get email from responsible_persons table
            person_record = db.query(ResponsiblePerson)\
                            .filter(ResponsiblePerson.name == person)\
                            .first()
            if person_record and person_record.email:
                email_service.send_overdue_reminder(actions, person_record.email)
    
    finally:
        db.close()
```

---

## 🗄️ Database Migration

```python
# migrate_da004.py

import sqlite3
from datetime import datetime

def migrate_da004():
    """Migration script for DA-004 Follow-up Actions"""
    conn = sqlite3.connect('complaint-system/backend/complaints.db')
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting DA-004 migration...")
        
        # 1. Create follow_up_actions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS follow_up_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id INTEGER NOT NULL,
                action_number INTEGER NOT NULL,
                action_text TEXT NOT NULL,
                responsible_person VARCHAR(255) NOT NULL,
                due_date DATE,
                status VARCHAR(20) DEFAULT 'open',
                priority VARCHAR(10) DEFAULT 'medium',
                notes TEXT,
                completion_percentage INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
                UNIQUE(complaint_id, action_number)
            )
        ''')
        
        # 2. Create action_history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS action_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_id INTEGER NOT NULL,
                field_changed VARCHAR(100) NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_by VARCHAR(255) NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                change_reason TEXT,
                FOREIGN KEY (action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE
            )
        ''')
        
        # 3. Create responsible_persons table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS responsible_persons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255),
                department VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 4. Create action_dependencies table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS action_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_id INTEGER NOT NULL,
                depends_on_action_id INTEGER NOT NULL,
                dependency_type VARCHAR(20) DEFAULT 'sequential',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE,
                FOREIGN KEY (depends_on_action_id) REFERENCES follow_up_actions(id) ON DELETE CASCADE
            )
        ''')
        
        # 5. Create indexes
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_actions_complaint_id ON follow_up_actions(complaint_id)',
            'CREATE INDEX IF NOT EXISTS idx_actions_status ON follow_up_actions(status)',
            'CREATE INDEX IF NOT EXISTS idx_actions_responsible ON follow_up_actions(responsible_person)',
            'CREATE INDEX IF NOT EXISTS idx_actions_due_date ON follow_up_actions(due_date)',
            'CREATE INDEX IF NOT EXISTS idx_history_action_id ON action_history(action_id)'
        ]
        
        for index in indexes:
            cursor.execute(index)
        
        # 6. Seed responsible persons
        default_persons = [
            ('AL', 'al@company.com', 'Quality'),
            ('JF', 'jf@company.com', 'Engineering'), 
            ('FC', 'fc@company.com', 'Management'),
            ('Système', 'system@company.com', 'System')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO responsible_persons (name, email, department) 
            VALUES (?, ?, ?)
        ''', default_persons)
        
        conn.commit()
        print("✅ DA-004 migration completed successfully!")
        
        # Verify tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%action%'")
        tables = cursor.fetchall()
        print(f"📊 Created {len(tables)} action-related tables: {[t[0] for t in tables]}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_da004()
```

---

## 🎯 Implementation Timeline

### Phase 1: Backend Foundation (Day 1-2)
- [ ] Database migration script
- [ ] SQLAlchemy models
- [ ] Pydantic schemas
- [ ] Basic API endpoints (CRUD)

### Phase 2: Frontend Components (Day 3-4)
- [ ] TypeScript interfaces
- [ ] FollowUpActionsPanel component
- [ ] ActionCard component
- [ ] AddActionForm component
- [ ] Custom hooks

### Phase 3: Integration (Day 5)
- [ ] Update Enhanced Complaint Detail Drawer
- [ ] Dashboard metrics
- [ ] Testing basic workflow

### Phase 4: Advanced Features (Day 6-7)
- [ ] Drag-drop reordering
- [ ] Email notification system
- [ ] Dependency management
- [ ] Advanced status transitions

### Phase 5: Testing & Polish (Day 8-9)
- [ ] Unit tests
- [ ] Integration tests
- [ ] UI/UX polish
- [ ] Performance optimization

### Phase 6: Deployment (Day 10)
- [ ] Production migration
- [ ] User training
- [ ] Documentation
- [ ] Go-live

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// FollowUpActionsPanel.test.tsx
// ActionCard.test.tsx  
// useFollowUpActions.test.ts
// Email notification tests
// API endpoint tests
```

### Integration Tests
```typescript
// Complete action lifecycle
// Drag-drop reordering
// Status transitions
// Email triggers
// Dashboard integration
```

### E2E Tests
```typescript
// Create action workflow
// Edit action workflow
// Status change workflow
// Overdue notifications
// Dependency management
```

---

## 🚀 Success Metrics

### Performance
- [ ] Action creation < 500ms
- [ ] Actions load < 1s
- [ ] Email delivery < 30s
- [ ] Dashboard update < 2s

### Functionality  
- [ ] Sequential action creation
- [ ] Status transitions work
- [ ] Email notifications sent
- [ ] Drag-drop reordering
- [ ] Mobile responsiveness

### Business
- [ ] Max 10 actions per complaint enforced
- [ ] Overdue tracking accurate
- [ ] Audit trail complete
- [ ] User adoption > 80%

---

## 📚 Documentation

### User Guide
- How to create actions
- Status management
- Email notifications
- Dependency rules

### Technical Guide
- API documentation
- Database schema
- Email configuration
- Deployment guide

### Compliance
- Audit trail documentation
- Data retention policy
- Regulatory compliance
- Security measures

---

This comprehensive design provides a complete follow-up actions system that matches your French action plan format while integrating seamlessly with the existing complaint management system. 