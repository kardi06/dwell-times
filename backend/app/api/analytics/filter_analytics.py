from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ...core.database import get_db
from ...models.camera_events import CameraEvent

router = APIRouter()

CAP = 500

@router.get("/filters/divisions")
async def get_divisions(
    search: Optional[str] = Query(None, description="Prefix search for division"),
    db: Session = Depends(get_db)
):
    try:
        q = db.query(func.distinct(CameraEvent.division)).filter(CameraEvent.division.isnot(None))
        if search:
            like = f"{search}%"
            q = q.filter(CameraEvent.division.ilike(like))
        q = q.order_by(CameraEvent.division).limit(CAP)
        items = [row[0] for row in q.all() if row[0]]
        return {"items": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters/departments")
async def get_departments(
    division: Optional[str] = Query(None),  # kept for compatibility but not required by UI
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        q = db.query(func.distinct(CameraEvent.department)).filter(CameraEvent.department.isnot(None))
        if division:
            q = q.filter(CameraEvent.division == division)
        if search:
            like = f"{search}%"
            q = q.filter(CameraEvent.department.ilike(like))
        q = q.order_by(CameraEvent.department).limit(CAP)
        items = [row[0] for row in q.all() if row[0]]
        return {"items": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters/stores")
async def get_stores(
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        q = db.query(func.distinct(CameraEvent.camera_group)).filter(CameraEvent.camera_group.isnot(None))
        if division:
            q = q.filter(CameraEvent.division == division)
        if department:
            q = q.filter(CameraEvent.department == department)
        if search:
            like = f"{search}%"
            q = q.filter(CameraEvent.camera_group.ilike(like))
        q = q.order_by(CameraEvent.camera_group).limit(CAP)
        items = [row[0] for row in q.all() if row[0]]
        return {"items": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters/cameras")
async def get_cameras(
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        q = db.query(func.distinct(CameraEvent.camera_description)).filter(CameraEvent.camera_description.isnot(None))
        if division:
            q = q.filter(CameraEvent.division == division)
        if department:
            q = q.filter(CameraEvent.department == department)
        if store:
            q = q.filter(CameraEvent.camera_group == store)
        if search:
            like = f"{search}%"
            q = q.filter(CameraEvent.camera_description.ilike(like))
        q = q.order_by(CameraEvent.camera_description).limit(CAP)
        items = [row[0] for row in q.all() if row[0]]
        return {"items": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
