"""
Dwell Time Analytics Module

This module handles dwell time analytics and aggregated dwell time statistics.
Endpoints:
- /dwell-time-analytics: Get dwell time analytics grouped by specified dimension
- /aggregated-dwell-time: Get aggregated dwell time statistics using pre-calculated dwell_time values
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
import logging

from ...core.database import get_db
from ...models.camera_events import CameraEvent
from ...services.dwell_time_engine import DwellTimeEngine
from ...core.exceptions import ProcessingError

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dwell-time-analytics")
async def get_dwell_time_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    group_by: str = Query("person", description="Group by: person, camera"),
    db: Session = Depends(get_db)
):
    """Get dwell time analytics grouped by specified dimension"""
    try:
        # Parse date parameters
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        # Validate group_by parameter
        if group_by not in ["person", "camera"]:
            raise HTTPException(status_code=400, detail="Invalid group_by. Must be person or camera")
        
        # Get analytics
        dwell_engine = DwellTimeEngine(db)
        analytics = dwell_engine.get_dwell_time_analytics(start_dt, end_dt, group_by)
        
        return {
            "dwell_time_analytics": analytics,
            "parameters": {
                "start_date": start_date,
                "end_date": end_date,
                "group_by": group_by
            }
        }
        
    except ProcessingError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Dwell time analytics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/aggregated-dwell-time")
async def get_aggregated_dwell_time_analytics(
    group_by: str = Query("person_id", description="Group by: person_id, camera_description"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get aggregated dwell time statistics using pre-calculated dwell_time values"""
    try:
        # Validate group_by parameter
        if group_by not in ["person_id", "camera_description"]:
            raise HTTPException(status_code=400, detail="Invalid group_by. Must be person_id or camera_description")
        
        # Parse date parameters
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        # Build query
        query = db.query(
            getattr(CameraEvent, group_by).label('group_value'),
            func.sum(CameraEvent.dwell_time).label('total_dwell_time'),
            func.avg(CameraEvent.dwell_time).label('avg_dwell_time'),
            func.count(CameraEvent.id).label('event_count'),
            func.min(CameraEvent.dwell_time).label('min_dwell_time'),
            func.max(CameraEvent.dwell_time).label('max_dwell_time')
        ).group_by(getattr(CameraEvent, group_by))
        
        # Apply date filters
        if start_dt:
            query = query.filter(CameraEvent.created_at >= start_dt)
        if end_dt:
            query = query.filter(CameraEvent.created_at <= end_dt)
        
        # Execute query
        results = query.all()
        
        # Format results
        analytics = []
        for result in results:
            analytics.append({
                'group_value': result.group_value,
                'total_dwell_time': int(result.total_dwell_time or 0),
                'avg_dwell_time': float(result.avg_dwell_time or 0),
                'event_count': result.event_count,
                'min_dwell_time': int(result.min_dwell_time or 0),
                'max_dwell_time': int(result.max_dwell_time or 0)
            })
        
        return {
            'analytics': analytics,
            'parameters': {
                'group_by': group_by,
                'start_date': start_date,
                'end_date': end_date
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get aggregated dwell time analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 