from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, extract, case
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
    search: Optional[str] = Query(None, description="Search term for person_id"),
    person_id: Optional[str] = Query(None, description="Filter by person_id"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    gender: Optional[str] = Query(None, description="Filter by gender_outcome"),
    age_group: Optional[str] = Query(None, description="Filter by age_group_outcome"),
    time_period: Optional[str] = Query(None, description="Filter by time period (e.g., '01:00 PM - 02:00 PM')"),
    camera_filter: Optional[str] = Query(None, description="Filter by camera_description"),
    zone_filter: Optional[str] = Query(None, description="Filter by zone_name"),
    sort_by: str = Query("created_at", description="Sort by: person_id, time_period, gender, age_group, total_dwell_time, event_count, created_at"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    """Get aggregated events grouped by person_id, time_period, gender, age_group"""
    try:
        # Validate sort parameters
        valid_sort_fields = ['person_id', 'date', 'time_period', 'gender', 'age_group', 'total_dwell_time', 'event_count', 'created_at']
        if sort_by not in valid_sort_fields:
            raise HTTPException(status_code=400, detail=f"Invalid sort_by. Must be one of: {valid_sort_fields}")
        
        if sort_order not in ['asc', 'desc']:
            raise HTTPException(status_code=400, detail="Invalid sort_order. Must be asc or desc")
        
        # Build query with new demographic grouping
        query = db.query(
            CameraEvent.person_id,
            # Date and time period calculation using utc_time_started_readable
            func.to_char(CameraEvent.utc_time_started_readable, 'YYYY-MM-DD').label('date'),
            func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00').label('time_period'),
            CameraEvent.gender_outcome.label('gender'),
            CameraEvent.age_group_outcome.label('age_group'),
            func.sum(CameraEvent.dwell_time).label('total_dwell_time'),
            func.count(CameraEvent.id).label('event_count'),
            func.max(CameraEvent.created_at).label('created_at')
        ).group_by(
            CameraEvent.person_id,
            func.to_char(CameraEvent.utc_time_started_readable, 'YYYY-MM-DD'),
            func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00'),
            CameraEvent.gender_outcome,
            CameraEvent.age_group_outcome
        )
        
        # Debug: Check what data exists in the database
        debug_query = db.query(
            CameraEvent.person_id,
            CameraEvent.gender_outcome,
            CameraEvent.age_group_outcome,
            func.to_char(CameraEvent.utc_time_started_readable, 'YYYY-MM-DD').label('date')
        ).limit(5)
        debug_results = debug_query.all()
        logger.info(f"Debug: Found {len(debug_results)} raw records")
        for i, result in enumerate(debug_results):
            logger.info(f"Debug record {i}: person_id='{result.person_id}', gender='{result.gender_outcome}', age_group='{result.age_group_outcome}', date='{result.date}'")
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(CameraEvent.person_id.ilike(search_term))
        
        if person_id:
            logger.info(f"Applying person_id filter: '{person_id}'")
            person_term = f"%{person_id}%"
            query = query.filter(CameraEvent.person_id.ilike(person_term))
        
        if date:
            logger.info(f"Applying date filter: '{date}'")
            query = query.filter(func.to_char(CameraEvent.utc_time_started_readable, 'YYYY-MM-DD') == date)
        
        if gender:
            logger.info(f"Applying gender filter: '{gender}'")
            query = query.filter(CameraEvent.gender_outcome == gender)
        
        if age_group:
            logger.info(f"Applying age_group filter: '{age_group}'")
            query = query.filter(CameraEvent.age_group_outcome == age_group)
        
        if time_period:
            # Convert frontend time period format to database format
            # Frontend sends "01:00 PM - 02:00 PM", we need to extract hour
            try:
                # Extract hour from time period like "01:00 PM - 02:00 PM"
                # Split by space and take the first part (before the dash)
                time_part = time_period.split(' - ')[0]  # "01:00 AM"
                # Parse the time to get hour
                time_obj = datetime.strptime(time_part, "%I:%M %p")
                hour = time_obj.hour
                db_time_period = f"{hour:02d}:00"  # "01:00" for 1 AM, "13:00" for 1 PM
                logger.info(f"Converted time_period '{time_period}' to database format '{db_time_period}'")
                query = query.filter(func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00') == db_time_period)
            except Exception as e:
                logger.warning(f"Failed to parse time_period filter '{time_period}': {e}")
                # Fallback to exact match
                query = query.filter(func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00') == time_period)
        
        if camera_filter:
            query = query.filter(CameraEvent.camera_description == camera_filter)
        
        if zone_filter:
            query = query.filter(CameraEvent.zone_name == zone_filter)
        
        # Apply sorting
        if sort_by == 'total_dwell_time':
            order_column = func.sum(CameraEvent.dwell_time)
        elif sort_by == 'event_count':
            order_column = func.count(CameraEvent.id)
        elif sort_by == 'created_at':
            order_column = func.max(CameraEvent.created_at)
        elif sort_by == 'date':
            order_column = func.to_char(CameraEvent.utc_time_started_readable, 'YYYY-MM-DD')
        elif sort_by == 'time_period':
            order_column = func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00')
        elif sort_by == 'gender':
            order_column = CameraEvent.gender_outcome
        elif sort_by == 'age_group':
            order_column = CameraEvent.age_group_outcome
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
        
        logger.info(f"Found {len(results)} results after filtering")
        
        # Format results with time period formatting
        events = []
        for result in results:
            # Format time period as "01:00 PM - 02:00 PM"
            time_period_formatted = _format_time_period(result.time_period)
            
            events.append({
                'person_id': result.person_id,
                'date': result.date,
                'time_period': time_period_formatted,
                'gender': result.gender or 'other',
                'age_group': result.age_group or 'other',
                'total_dwell_time': int(result.total_dwell_time or 0),
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

def _format_time_period(time_str: str) -> str:
    """Format time period as '01:00 PM - 02:00 PM'"""
    try:
        if not time_str:
            return "Unknown"
        
        # Parse hour from "HH:00" format
        hour = int(time_str.split(':')[0])
        
        # Format as "HH:00 AM/PM - (HH+1):00 AM/PM"
        start_time = f"{hour:02d}:00"
        end_hour = (hour + 1) % 24
        end_time = f"{end_hour:02d}:00"
        
        # Convert to 12-hour format
        start_12hr = datetime.strptime(start_time, "%H:%M").strftime("%I:%M %p")
        end_12hr = datetime.strptime(end_time, "%H:%M").strftime("%I:%M %p")
        
        return f"{start_12hr} - {end_12hr}"
    except Exception:
        return "Unknown"

@router.get("/demographic-insights")
async def get_demographic_insights(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    gender: Optional[str] = Query(None, description="Filter by gender_outcome"),
    age_group: Optional[str] = Query(None, description="Filter by age_group_outcome"),
    time_period: Optional[str] = Query(None, description="Filter by time period"),
    db: Session = Depends(get_db)
):
    """Get demographic insights and analytics"""
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
        
        # Build query for demographic insights
        query = db.query(
            CameraEvent.gender_outcome,
            CameraEvent.age_group_outcome,
            func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00').label('time_period'),
            func.sum(CameraEvent.dwell_time).label('total_dwell_time'),
            func.avg(CameraEvent.dwell_time).label('avg_dwell_time'),
            func.count(CameraEvent.id).label('event_count'),
            func.count(func.distinct(CameraEvent.person_id)).label('unique_visitors')
        ).group_by(
            CameraEvent.gender_outcome,
            CameraEvent.age_group_outcome,
            func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00')
        )
        
        # Apply filters
        if start_dt:
            query = query.filter(CameraEvent.created_at >= start_dt)
        if end_dt:
            query = query.filter(CameraEvent.created_at <= end_dt)
        if gender:
            query = query.filter(CameraEvent.gender_outcome == gender)
        if age_group:
            query = query.filter(CameraEvent.age_group_outcome == age_group)
        if time_period:
            # Convert frontend time period format to database format
            # Frontend sends "01:00 PM - 02:00 PM", we need to extract hour
            try:
                # Extract hour from time period like "01:00 PM - 02:00 PM"
                # Split by space and take the first part (before the dash)
                time_part = time_period.split(' - ')[0]  # "01:00 AM"
                # Parse the time to get hour
                time_obj = datetime.strptime(time_part, "%I:%M %p")
                hour = time_obj.hour
                db_time_period = f"{hour:02d}:00"  # "01:00" for 1 AM, "13:00" for 1 PM
                logger.info(f"Converted time_period '{time_period}' to database format '{db_time_period}'")
                query = query.filter(func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00') == db_time_period)
            except Exception as e:
                logger.warning(f"Failed to parse time_period filter '{time_period}': {e}")
                # Fallback to exact match
                query = query.filter(func.to_char(CameraEvent.utc_time_started_readable, 'HH24:00') == time_period)
        
        # Execute query
        results = query.all()
        
        # Format results
        insights = []
        for result in results:
            insights.append({
                'gender': result.gender_outcome or 'other',
                'age_group': result.age_group_outcome or 'other',
                'time_period': _format_time_period(result.time_period),
                'total_dwell_time': int(result.total_dwell_time or 0),
                'avg_dwell_time': float(result.avg_dwell_time or 0),
                'event_count': result.event_count,
                'unique_visitors': result.unique_visitors
            })
        
        return {
            'demographic_insights': insights,
            'parameters': {
                'start_date': start_date,
                'end_date': end_date,
                'gender': gender,
                'age_group': age_group,
                'time_period': time_period
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get demographic insights: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/demographic-distribution")
async def get_demographic_distribution(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get demographic distribution analytics"""
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
        
        # Gender distribution
        gender_query = db.query(
            CameraEvent.gender_outcome,
            func.count(func.distinct(CameraEvent.person_id)).label('visitor_count'),
            func.sum(CameraEvent.dwell_time).label('total_dwell_time')
        ).group_by(CameraEvent.gender_outcome)
        
        # Age group distribution
        age_query = db.query(
            CameraEvent.age_group_outcome,
            func.count(func.distinct(CameraEvent.person_id)).label('visitor_count'),
            func.sum(CameraEvent.dwell_time).label('total_dwell_time')
        ).group_by(CameraEvent.age_group_outcome)
        
        # Apply date filters
        if start_dt:
            gender_query = gender_query.filter(CameraEvent.created_at >= start_dt)
            age_query = age_query.filter(CameraEvent.created_at >= start_dt)
        if end_dt:
            gender_query = gender_query.filter(CameraEvent.created_at <= end_dt)
            age_query = age_query.filter(CameraEvent.created_at <= end_dt)
        
        # Execute queries
        gender_results = gender_query.all()
        age_results = age_query.all()
        
        # Format results
        gender_distribution = []
        for result in gender_results:
            gender_distribution.append({
                'gender': result.gender_outcome or 'other',
                'visitor_count': result.visitor_count,
                'total_dwell_time': int(result.total_dwell_time or 0)
            })
        
        age_distribution = []
        for result in age_results:
            age_distribution.append({
                'age_group': result.age_group_outcome or 'other',
                'visitor_count': result.visitor_count,
                'total_dwell_time': int(result.total_dwell_time or 0)
            })
        
        return {
            'gender_distribution': gender_distribution,
            'age_distribution': age_distribution,
            'parameters': {
                'start_date': start_date,
                'end_date': end_date
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get demographic distribution: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/chart-data")
async def get_chart_data(
    time_period: str = Query("week", description="Time period: day, week, month, quarter, year"),
    metric_type: str = Query("average", description="Metric type: total, average"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get chart data for dwell time analytics with demographic breakdowns"""
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
                # For end_date, set to end of day (23:59:59.999) to include all data for that day
                end_dt = datetime.fromisoformat(end_date)
                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

        # Build base query
        query = db.query(CameraEvent)
        
        # Apply date filters
        if start_dt:
            query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
        if end_dt:
            query = query.filter(CameraEvent.utc_time_started_readable <= end_dt)

        # Apply time period filtering only if no specific dates are provided
        if not start_dt and not end_dt:
            if time_period == "day":
                # Get data for the last 24 hours
                end_dt = datetime.now()
                start_dt = end_dt - timedelta(days=1)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
            elif time_period == "week":
                # Get data for the last 7 days
                end_dt = datetime.now()
                start_dt = end_dt - timedelta(days=7)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
            elif time_period == "month":
                # Get data for the last 30 days
                end_dt = datetime.now()
                start_dt = end_dt - timedelta(days=30)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
            elif time_period == "quarter":
                # Get data for the last 90 days
                end_dt = datetime.now()
                start_dt = end_dt - timedelta(days=90)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
            elif time_period == "year":
                # Get data for the last 365 days
                end_dt = datetime.now()
                start_dt = end_dt - timedelta(days=365)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)

        # Aggregate data by age group and gender
        result = query.with_entities(
            func.coalesce(CameraEvent.age_group_outcome, 'Other').label('age_group'),
            func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
            func.sum(CameraEvent.dwell_time).label('total_dwell_time'),
            func.avg(CameraEvent.dwell_time).label('avg_dwell_time'),
            func.count(CameraEvent.id).label('event_count')
        ).group_by(
            func.coalesce(CameraEvent.age_group_outcome, 'Other'),
            func.coalesce(CameraEvent.gender_outcome, 'other')
        ).all()

        # Format the results
        chart_data = []
        for row in result:
            chart_data.append({
                "age_group": row.age_group or "Other",
                "gender": row.gender or "other",
                "total_dwell_time": int(row.total_dwell_time or 0),
                "avg_dwell_time": float(row.avg_dwell_time or 0),
                "event_count": int(row.event_count or 0)
            })

        # Add debug information
        logger.info(f"Chart data query - time_period: {time_period}, metric_type: {metric_type}")
        logger.info(f"Date filters - start_dt: {start_dt}, end_dt: {end_dt}")
        logger.info(f"Found {len(chart_data)} records")

        return {
            "chart_data": chart_data,
            "time_period": time_period,
            "metric_type": metric_type,
            "total_records": len(chart_data),
            "debug": {
                "start_date": start_date,
                "end_date": end_date,
                "start_dt": start_dt.isoformat() if start_dt else None,
                "end_dt": end_dt.isoformat() if end_dt else None
            }
        }

    except Exception as e:
        logger.error(f"Chart data retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve chart data")

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