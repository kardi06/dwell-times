"""
Occupancy Analytics Module

This module handles occupancy analytics by time periods.
Endpoints:
- /occupancy-analytics: Get occupancy analytics by time periods
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import logging

from ...core.database import get_db
from ...services.analytics_service import AnalyticsService
from ...core.exceptions import AnalyticsError

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/occupancy-analytics")
async def get_occupancy_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    time_period: str = Query("hour", description="Time period: hour, day, week"),
    db: Session = Depends(get_db)
):
    """Get occupancy analytics by time periods"""
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
        
        # Validate time period
        if time_period not in ["hour", "day", "week"]:
            raise HTTPException(status_code=400, detail="Invalid time_period. Must be hour, day, or week")
        
        # Get analytics
        analytics_service = AnalyticsService(db)
        occupancy = analytics_service.calculate_occupancy_analytics(start_dt, end_dt, time_period)
        
        return {
            "occupancy_analytics": occupancy,
            "parameters": {
                "start_date": start_date,
                "end_date": end_date,
                "time_period": time_period
            }
        }
        
    except AnalyticsError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Occupancy analytics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 