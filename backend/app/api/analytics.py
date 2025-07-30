from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
import tempfile
import os
import logging

from ..core.database import get_db
from ..services.csv_processor import CSVProcessor
from ..services.dwell_time_engine import DwellTimeEngine
from ..services.analytics_service import AnalyticsService
# Authentication temporarily disabled for testing
# from ..services.auth_service import AuthService
# from ..models.user import User
from ..core.exceptions import DataValidationError, ProcessingError, AnalyticsError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.post("/upload-csv")
async def upload_csv_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process CSV camera event data"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Save uploaded file temporarily
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            # Process CSV file
            processor = CSVProcessor(db)
            result = processor.process_csv_file(temp_file_path)
            
            # Calculate dwell times for the uploaded data
            dwell_engine = DwellTimeEngine(db)
            dwell_result = dwell_engine.calculate_dwell_times()
            
            # Calculate analytics
            analytics_service = AnalyticsService(db)
            analytics = analytics_service.calculate_kpi_metrics()
            
            return {
                "message": "CSV data uploaded and processed successfully",
                "upload_result": result,
                "dwell_time_calculation": dwell_result,
                "analytics": analytics
            }
            
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temporary file {temp_file_path}: {e}")
                
    except DataValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ProcessingError as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    except Exception as e:
        logger.error(f"CSV upload failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

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

@router.get("/repeat-visitor-stats")
async def get_repeat_visitor_stats(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get repeat visitor statistics"""
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
        stats = analytics_service.calculate_repeat_visitor_stats(start_dt, end_dt)
        
        return {
            "repeat_visitor_stats": stats,
            "parameters": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except AnalyticsError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Repeat visitor stats retrieval failed: {e}")
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

@router.post("/calculate-dwell-times")
async def calculate_dwell_times(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Manually trigger dwell time calculations"""
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
        
        # Calculate dwell times
        dwell_engine = DwellTimeEngine(db)
        result = dwell_engine.calculate_dwell_times(start_dt, end_dt)
        
        return {
            "message": "Dwell time calculation completed",
            "result": result
        }
        
    except ProcessingError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Dwell time calculation failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 