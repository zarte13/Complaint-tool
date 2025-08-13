from fastapi import APIRouter, Depends, Query
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

@router.get("/weekly-type-trends")
def get_weekly_type_trends(
    weeks: int = Query(12, ge=1, le=52, description="Number of recent ISO weeks to include"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get last 12 weeks complaint counts split by issue_type buckets.
    Returns an array [{ week: 'YYYY-Www', wrong_quantity: n, wrong_part: n, damaged: n, other: n }].

    Notes:
    - Uses Complaint.date_received (business date) instead of created_at
    - Includes the current week plus previous 11 weeks (total 12)
    - Weeks aligned to Monday (ISO week date)
    """
    # Work with date objects to align with `date_received` column
    today = datetime.utcnow().date()
    start_of_week_date = today - timedelta(days=today.weekday())  # Monday

    # Build N weekly windows including current week (oldest first)
    windows: list[tuple] = []
    for i in range(weeks - 1, -1, -1):
        week_start_date = start_of_week_date - timedelta(weeks=i)
        week_end_date = week_start_date + timedelta(days=7)
        windows.append((week_start_date, week_end_date))

    # Helper to count by type in a window (inclusive start, exclusive end)
    def count_in_range(issue_type: str, start_date, end_date) -> int:
        return (
            db.query(Complaint)
            .filter(Complaint.date_received >= start_date, Complaint.date_received < end_date, Complaint.issue_type == issue_type)
            .count()
        )

    response: List[Dict[str, Any]] = []
    for (ws, we) in windows:
        # Week label ISO year-week from start date
        iso = ws.isocalendar()
        iso_year, iso_week = iso[0], iso[1]
        label = f"{iso_year}-W{iso_week:02d}"
        row = {
            "week": label,
            "wrong_quantity": count_in_range("wrong_quantity", ws, we),
            "wrong_part": count_in_range("wrong_part", ws, we),
            "damaged": count_in_range("damaged", ws, we),
        }
        # 'other' as remaining types in the window
        other_count = (
            db.query(Complaint)
            .filter(Complaint.date_received >= ws, Complaint.date_received < we)
            .filter(Complaint.issue_type.notin_(["wrong_quantity", "wrong_part", "damaged"]))
            .count()
        )
        row["other"] = other_count
        response.append(row)

    return response

@router.get("/status-counts")
def get_status_counts(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get complaint counts by status (open, in_progress, resolved)."""
    # Count complaints by status
    open_count = db.query(Complaint).filter(Complaint.status == "open").count()
    in_progress_count = db.query(Complaint).filter(Complaint.status == "in_progress").count()
    resolved_count = db.query(Complaint).filter(Complaint.status == "resolved").count()
    
    return {
        "open": open_count,
        "in_progress": in_progress_count,
        "resolved": resolved_count
    }