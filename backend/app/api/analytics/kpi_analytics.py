"""
KPI & Basic Analytics Module

This module handles KPI metrics and comprehensive analytics.
Endpoints:
- /kpi-metrics: Get KPI metrics for the specified date range
- /comprehensive-analytics: Get comprehensive analytics combining all metrics
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

@router.get("/kpi-metrics")
async def get_kpi_metrics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get KPI metrics for the specified date range"""
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
        
        # Get analytics
        analytics_service = AnalyticsService(db)
        metrics = analytics_service.calculate_kpi_metrics(start_dt, end_dt)
        
        return {
            "kpi_metrics": metrics,
            "date_range": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except AnalyticsError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"KPI metrics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/comprehensive-analytics")
async def get_comprehensive_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics combining all metrics"""
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
        
        # Get comprehensive analytics
        analytics_service = AnalyticsService(db)
        analytics = analytics_service.get_comprehensive_analytics(start_dt, end_dt)
        
        return analytics
        
    except AnalyticsError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Comprehensive analytics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 