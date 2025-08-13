from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database.database import get_db
from app.models.models import AppSetting
from app.auth.dependencies import require_admin
import json

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/app")
@router.get("/app/")
def get_app_settings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    rows = db.query(AppSetting).all()
    out: Dict[str, Any] = {}
    for r in rows:
        try:
            out[r.key] = json.loads(r.value_json)
        except Exception:
            out[r.key] = r.value_json
    return out

@router.put("/app")
@router.put("/app/")
def put_app_settings(payload: Dict[str, Any], db: Session = Depends(get_db), _admin = Depends(require_admin)) -> Dict[str, Any]:
    # Upsert all keys in payload
    for key, value in payload.items():
        serialized = json.dumps(value)
        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        if row:
            row.value_json = serialized
        else:
            row = AppSetting(key=key, value_json=serialized)
            db.add(row)
    db.commit()
    return {"status": "ok"}


