from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.models import Complaint
from sqlalchemy import func
from functools import lru_cache

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

@router.get("/mttr")
def get_mttr(weeks: int = Query(12, ge=1, le=52), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Mean Time To Resolution in days for complaints resolved in the window.
    Window is based on date_received within last N weeks.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(weeks=weeks)
    resolved = (
        db.query(Complaint)
        .filter(Complaint.date_received >= start_date)
        .filter(Complaint.resolved_at.isnot(None))
        .all()
    )
    if not resolved:
        return {"mttr_days": 0, "count": 0}
    diffs = []
    for c in resolved:
        try:
            d1 = c.date_received
            d2 = c.resolved_at.date() if c.resolved_at else None
            if d1 and d2:
                diffs.append((d2 - d1).days)
        except Exception:
            continue
    if not diffs:
        return {"mttr_days": 0, "count": 0}
    avg = sum(diffs) / len(diffs)
    return {"mttr_days": round(avg, 2), "count": len(diffs)}

@router.get("/actions/overdue-summary")
def get_overdue_actions_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Placeholder summary for overdue actions; extend if needed."""
    from app.models.models import FollowUpAction
    today = datetime.utcnow().date()
    overdue = (
        db.query(FollowUpAction)
        .filter(FollowUpAction.due_date.isnot(None))
        .filter(FollowUpAction.due_date < today)
        .filter(FollowUpAction.status != 'closed')
        .count()
    )
    return {"overdue_actions": overdue}

@router.get("/top/companies")
def get_top_companies(limit: int = Query(6, ge=1, le=50), weeks: int = Query(12, ge=1, le=52), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(weeks=weeks)
    rows = (
        db.query(Complaint.company_id, func.count(Complaint.id))
        .filter(Complaint.date_received >= start_date)
        .group_by(Complaint.company_id)
        .order_by(func.count(Complaint.id).desc())
        .limit(limit)
        .all()
    )
    # Resolve names
    from app.models.models import Company
    out: List[Dict[str, Any]] = []
    for cid, cnt in rows:
        name = db.query(Company.name).filter(Company.id == cid).scalar() or str(cid)
        out.append({"label": name, "value": cnt})
    return out

@router.get("/top/parts")
def get_top_parts(limit: int = Query(20, ge=1, le=100), weeks: int = Query(12, ge=1, le=52), db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(weeks=weeks)
    rows = (
        db.query(Complaint.part_id, func.count(Complaint.id))
        .filter(Complaint.date_received >= start_date)
        .group_by(Complaint.part_id)
        .order_by(func.count(Complaint.id).desc())
        .limit(limit)
        .all()
    )
    from app.models.models import Part
    out: List[Dict[str, Any]] = []
    for pid, cnt in rows:
        partnum = db.query(Part.part_number).filter(Part.id == pid).scalar() or str(pid)
        out.append({"label": partnum, "value": cnt})
    return out

@router.get("/actions-per-complaint")
def get_actions_per_complaint(weeks: int = Query(12, ge=1, le=52), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Average number of follow-up actions per complaint in the window.
    Window is based on complaints received in the last N weeks.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(weeks=weeks)
    # Complaint IDs in window
    q_ids = (
        db.query(Complaint.id)
        .filter(Complaint.date_received >= start_date)
        .all()
    )
    complaint_ids = [row[0] for row in q_ids]
    if not complaint_ids:
        return {"average": 0, "complaints": 0, "actions": 0}
    from app.models.models import FollowUpAction
    total_actions = (
        db.query(func.count(FollowUpAction.id))
        .filter(FollowUpAction.complaint_id.in_(complaint_ids))
        .scalar()
    ) or 0
    avg = total_actions / max(1, len(complaint_ids))
    return {"average": round(avg, 2), "complaints": len(complaint_ids), "actions": int(total_actions)}

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