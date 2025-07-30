from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from datetime import datetime, timedelta
import tempfile
import os
import logging

from ..core.database import get_db
from ..models.camera_events import CameraEvent
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

@router.get("/events")
async def get_aggregated_events(
    page: int = Query(0, ge=0, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search term for person_id or camera_description"),
    camera_filter: Optional[str] = Query(None, description="Filter by camera_description"),
    zone_filter: Optional[str] = Query(None, description="Filter by zone_name"),
    sort_by: str = Query("created_at", description="Sort by: person_id, camera_description, total_dwell_time, avg_dwell_time, event_count, created_at"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    """Get aggregated events grouped by person_id and camera_description"""
    try:
        # Validate sort parameters
        valid_sort_fields = ['person_id', 'camera_description', 'zone_name', 'total_dwell_time', 'avg_dwell_time', 'event_count', 'created_at']
        if sort_by not in valid_sort_fields:
            raise HTTPException(status_code=400, detail=f"Invalid sort_by. Must be one of: {valid_sort_fields}")
        
        if sort_order not in ['asc', 'desc']:
            raise HTTPException(status_code=400, detail="Invalid sort_order. Must be asc or desc")
        
        # Build query with GROUP BY
        query = db.query(
            CameraEvent.person_id,
            CameraEvent.camera_description,
            CameraEvent.zone_name,
            func.sum(CameraEvent.dwell_time).label('total_dwell_time'),
            func.avg(CameraEvent.dwell_time).label('avg_dwell_time'),
            func.count(CameraEvent.id).label('event_count'),
            func.max(CameraEvent.created_at).label('created_at')
        ).group_by(
            CameraEvent.person_id,
            CameraEvent.camera_description,
            CameraEvent.zone_name
        )
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    CameraEvent.person_id.ilike(search_term),
                    CameraEvent.camera_description.ilike(search_term)
                )
            )
        
        if camera_filter:
            query = query.filter(CameraEvent.camera_description == camera_filter)
        
        if zone_filter:
            query = query.filter(CameraEvent.zone_name == zone_filter)
        
        # Apply sorting
        if sort_by == 'total_dwell_time':
            order_column = func.sum(CameraEvent.dwell_time)
        elif sort_by == 'avg_dwell_time':
            order_column = func.avg(CameraEvent.dwell_time)
        elif sort_by == 'event_count':
            order_column = func.count(CameraEvent.id)
        elif sort_by == 'created_at':
            order_column = func.max(CameraEvent.created_at)
        else:
            order_column = getattr(CameraEvent, sort_by)
        
        if sort_order == 'desc':
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        query = query.offset(page * limit).limit(limit)
        
        # Execute query
        results = query.all()
        
        # Format results
        events = []
        for result in results:
            events.append({
                'person_id': result.person_id,
                'camera_description': result.camera_description,
                'zone_name': result.zone_name or '-',
                'total_dwell_time': int(result.total_dwell_time or 0),
                'avg_dwell_time': float(result.avg_dwell_time or 0),
                'event_count': result.event_count,
                'created_at': result.created_at.isoformat() if result.created_at else None
            })
        
        return {
            'events': events,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get aggregated events: {e}")
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