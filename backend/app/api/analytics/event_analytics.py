"""
Event Management Analytics Module

This module handles aggregated events with complex filtering, sorting, and pagination.
Endpoints:
- /events: Get aggregated events grouped by person_id, time_period, gender, age_group
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
import logging

from ...core.database import get_db
from ...models.camera_events import CameraEvent

logger = logging.getLogger(__name__)

router = APIRouter()

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