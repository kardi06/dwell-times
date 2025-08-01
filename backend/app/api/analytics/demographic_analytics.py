"""
Demographic Analytics Module

This module handles demographic insights and distribution analytics.
Endpoints:
- /demographic-insights: Get demographic insights and analytics
- /demographic-distribution: Get demographic distribution analytics
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