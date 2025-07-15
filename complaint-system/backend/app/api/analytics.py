from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.models import Complaint

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/rar-metrics")
def get_rar_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get Return, Authorization, and Rejection rates."""
    total_complaints = db.query(Complaint).count()
    
    # Calculate rates based on status
    return_count = db.query(Complaint).filter(Complaint.status == "returned").count()
    authorized_count = db.query(Complaint).filter(Complaint.status == "authorized").count()
    rejected_count = db.query(Complaint).filter(Complaint.status == "rejected").count()
    
    return {
        "returnRate": (return_count / total_complaints * 100) if total_complaints > 0 else 0,
        "authorizationRate": (authorized_count / total_complaints * 100) if total_complaints > 0 else 0,
        "rejectionRate": (rejected_count / total_complaints * 100) if total_complaints > 0 else 0,
        "totalComplaints": total_complaints,
        "period": "all_time"
    }

@router.get("/failure-modes")
def get_failure_modes(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get top 3 failure modes ranked by frequency."""
    from sqlalchemy import func
    
    results = db.query(
        Complaint.issue_type,
        func.count(Complaint.id).label('count')
    ).group_by(Complaint.issue_type).order_by(func.count(Complaint.id).desc()).limit(3).all()
    
    return [
        {"issueType": result.issue_type, "count": result.count}
        for result in results
    ]

@router.get("/trends")
def get_trends(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get complaint trends for sparklines."""
    from sqlalchemy import func
    
    # Get daily complaint counts for last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    daily_counts = db.query(
        func.date(Complaint.created_at).label('date'),
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.created_at >= start_date
    ).group_by(func.date(Complaint.created_at)).all()
    
    return {
        "labels": [str(result.date) for result in daily_counts],
        "data": [result.count for result in daily_counts]
    }