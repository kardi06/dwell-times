"""
Dwell Time Analytics Module

This module handles dwell time analytics and aggregated dwell time statistics.
Endpoints:
- /dwell-time-analytics: Get dwell time analytics grouped by specified dimension
- /aggregated-dwell-time: Get aggregated dwell time statistics using pre-calculated dwell_time values
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import datetime, timedelta
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
    

@router.get("/dwell-time-time-series")
async def get_dwell_time_time_series(
    view_type: str = Query("hourly", description="View type: hourly or daily"),
    metric_type: str = Query("average", description="Metric type: average or total (minutes)"),
    breakdown: str = Query("none", description="Breakdown: none, gender, age, gender_age"),
    department: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    camera: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Dwell time series: average or total dwell minutes by hour (10-22) or by day of week, filtered by hierarchy and date range."""
    try:
        if view_type not in ["hourly", "daily"]:
            raise HTTPException(status_code=400, detail="Invalid view_type. Must be hourly or daily")
        if metric_type not in ["average", "total"]:
            raise HTTPException(status_code=400, detail="Invalid metric_type. Must be average or total")
        if breakdown not in ["none", "gender", "age", "gender_age"]:
            raise HTTPException(status_code=400, detail="Invalid breakdown. Must be none, gender, age, or gender_age")

        # Parse date range; default last 7 days if not provided
        now = datetime.now()
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
                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        if not start_dt or not end_dt:
            end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            start_dt = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)

        # Base query with filters
        query = db.query(CameraEvent)
        if department:
            query = query.filter(CameraEvent.department == department)
        if store:
            query = query.filter(CameraEvent.camera_group == store)
        if camera:
            query = query.filter(CameraEvent.camera_description == camera)
        query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
        query = query.filter(CameraEvent.utc_time_started_readable <= end_dt)

        # Aggregation
        if view_type == "hourly":
            query = query.filter(extract('hour', CameraEvent.utc_time_started_readable).between(10, 22))
            time_expr = extract('hour', CameraEvent.utc_time_started_readable).label('bucket')
        else:
            time_expr = func.extract('dow', CameraEvent.utc_time_started_readable).label('bucket')

        # Selects based on metric type
        avg_expr = func.avg(CameraEvent.dwell_time).label('avg_sec')
        sum_expr = func.sum(CameraEvent.dwell_time).label('sum_sec')
        cnt_expr = func.count(CameraEvent.id).label('event_count')

        rows = []
        if breakdown in ("none", "gender"):
            # group by time and gender; later we can reduce to total if breakdown == none
            q = query.with_entities(
                time_expr,
                func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
                avg_expr,
                sum_expr,
                cnt_expr,
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(time_expr, func.coalesce(CameraEvent.gender_outcome, 'other')).order_by(time_expr)
            rows = q.all()
        elif breakdown == "age":
            # group by time and age group (aggregate across genders male/female only)
            q = query.with_entities(
                time_expr,
                func.coalesce(CameraEvent.age_group_outcome, 'Other').label('age_group'),
                avg_expr,
                sum_expr,
                cnt_expr,
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(time_expr, func.coalesce(CameraEvent.age_group_outcome, 'Other')).order_by(time_expr)
            rows = q.all()
        else:  # gender_age
            q = query.with_entities(
                time_expr,
                func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
                func.coalesce(CameraEvent.age_group_outcome, 'Other').label('age_group'),
                avg_expr,
                sum_expr,
                cnt_expr,
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(
                time_expr,
                func.coalesce(CameraEvent.gender_outcome, 'other'),
                func.coalesce(CameraEvent.age_group_outcome, 'Other')
            ).order_by(time_expr)
            rows = q.all()

        # Build buckets
        data = []
        if view_type == "hourly":
            hour_labels = ["10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM"]
            hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
            for i, hour in enumerate(hours):
                bucket = { 'time_period': hour_labels[i] }
                male_count = female_count = 0
                # Aggregate values into bucket based on breakdown
                if breakdown in ("none", "gender"):
                    male_val = female_val = 0.0
                    male_sum = female_sum = 0.0
                    for r in rows:
                        if int(getattr(r, 'bucket')) == hour:
                            if r.gender == 'male':
                                male_val = float(getattr(r, 'avg_sec') or 0)
                                male_sum = float(getattr(r, 'sum_sec') or 0)
                                male_count = int(getattr(r, 'event_count') or 0)
                            elif r.gender == 'female':
                                female_val = float(getattr(r, 'avg_sec') or 0)
                                female_sum = float(getattr(r, 'sum_sec') or 0)
                                female_count = int(getattr(r, 'event_count') or 0)
                    if metric_type == 'average':
                        total_count = male_count + female_count
                        total_val_sec = (male_val * male_count + female_val * female_count) / total_count if total_count > 0 else 0.0
                        bucket['male_minutes'] = round(male_val / 60.0, 2)
                        bucket['female_minutes'] = round(female_val / 60.0, 2)
                        bucket['total_minutes'] = round(total_val_sec / 60.0, 2)
                    else:
                        bucket['male_minutes'] = round(male_sum / 60.0, 2)
                        bucket['female_minutes'] = round(female_sum / 60.0, 2)
                        bucket['total_minutes'] = round((male_sum + female_sum) / 60.0, 2)
                    bucket['sample_size'] = male_count + female_count
                elif breakdown == "age":
                    age_groups = {}
                    total_sum = 0.0
                    total_cnt = 0
                    for r in rows:
                        if int(getattr(r, 'bucket')) == hour:
                            age = getattr(r, 'age_group') or 'Other'
                            val = float(getattr(r, 'avg_sec') or 0)
                            s = float(getattr(r, 'sum_sec') or 0)
                            c = int(getattr(r, 'event_count') or 0)
                            if metric_type == 'average':
                                age_groups[age] = round(val / 60.0, 2)
                                total_sum += val * c
                                total_cnt += c
                            else:
                                age_groups[age] = round(s / 60.0, 2)
                                total_sum += s
                                total_cnt += c
                    bucket['age_groups'] = [ { 'age_group': k, 'minutes': v } for k, v in age_groups.items() ]
                    bucket['total_minutes'] = round((total_sum / total_cnt) / 60.0, 2) if metric_type == 'average' and total_cnt > 0 else round(total_sum / 60.0, 2)
                    bucket['sample_size'] = total_cnt
                else:  # gender_age
                    gender_age = { 'male': {}, 'female': {} }
                    total_sum = 0.0
                    total_cnt = 0
                    for r in rows:
                        if int(getattr(r, 'bucket')) == hour:
                            g = getattr(r, 'gender')
                            age = getattr(r, 'age_group') or 'Other'
                            val = float(getattr(r, 'avg_sec') or 0)
                            s = float(getattr(r, 'sum_sec') or 0)
                            c = int(getattr(r, 'event_count') or 0)
                            if g not in ('male','female'):
                                continue
                            if metric_type == 'average':
                                gender_age[g][age] = round(val / 60.0, 2)
                                total_sum += val * c
                                total_cnt += c
                            else:
                                gender_age[g][age] = round(s / 60.0, 2)
                                total_sum += s
                                total_cnt += c
                    bucket['gender_age'] = { 'male': [ { 'age_group': k, 'minutes': v } for k, v in gender_age['male'].items() ], 'female': [ { 'age_group': k, 'minutes': v } for k, v in gender_age['female'].items() ] }
                    bucket['total_minutes'] = round((total_sum / total_cnt) / 60.0, 2) if metric_type == 'average' and total_cnt > 0 else round(total_sum / 60.0, 2)
                    bucket['sample_size'] = total_cnt
                data.append(bucket)
        else:
            day_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_mapping = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
            expected_days = [0,1,2,3,4,5,6]
            for i, expected_day in enumerate(expected_days):
                bucket = { 'time_period': day_labels[i] }
                male_count = female_count = 0
                if breakdown in ("none", "gender"):
                    male_val = female_val = 0.0
                    male_sum = female_sum = 0.0
                    for r in rows:
                        db_day = int(getattr(r, 'bucket'))
                        if db_day in day_mapping and day_mapping[db_day] == expected_day:
                            if r.gender == 'male':
                                male_val = float(getattr(r, 'avg_sec') or 0)
                                male_sum = float(getattr(r, 'sum_sec') or 0)
                                male_count = int(getattr(r, 'event_count') or 0)
                            elif r.gender == 'female':
                                female_val = float(getattr(r, 'avg_sec') or 0)
                                female_sum = float(getattr(r, 'sum_sec') or 0)
                                female_count = int(getattr(r, 'event_count') or 0)
                    if metric_type == 'average':
                        total_count = male_count + female_count
                        total_val_sec = (male_val * male_count + female_val * female_count) / total_count if total_count > 0 else 0.0
                        bucket['male_minutes'] = round(male_val / 60.0, 2)
                        bucket['female_minutes'] = round(female_val / 60.0, 2)
                        bucket['total_minutes'] = round(total_val_sec / 60.0, 2)
                    else:
                        bucket['male_minutes'] = round(male_sum / 60.0, 2)
                        bucket['female_minutes'] = round(female_sum / 60.0, 2)
                        bucket['total_minutes'] = round((male_sum + female_sum) / 60.0, 2)
                    bucket['sample_size'] = male_count + female_count
                elif breakdown == "age":
                    age_groups = {}
                    total_sum = 0.0
                    total_cnt = 0
                    for r in rows:
                        db_day = int(getattr(r, 'bucket'))
                        if db_day in day_mapping and day_mapping[db_day] == expected_day:
                            age = getattr(r, 'age_group') or 'Other'
                            val = float(getattr(r, 'avg_sec') or 0)
                            s = float(getattr(r, 'sum_sec') or 0)
                            c = int(getattr(r, 'event_count') or 0)
                            if metric_type == 'average':
                                age_groups[age] = round(val / 60.0, 2)
                                total_sum += val * c
                                total_cnt += c
                            else:
                                age_groups[age] = round(s / 60.0, 2)
                                total_sum += s
                                total_cnt += c
                    bucket['age_groups'] = [ { 'age_group': k, 'minutes': v } for k, v in age_groups.items() ]
                    bucket['total_minutes'] = round((total_sum / total_cnt) / 60.0, 2) if metric_type == 'average' and total_cnt > 0 else round(total_sum / 60.0, 2)
                    bucket['sample_size'] = total_cnt
                else:
                    gender_age = { 'male': {}, 'female': {} }
                    total_sum = 0.0
                    total_cnt = 0
                    for r in rows:
                        db_day = int(getattr(r, 'bucket'))
                        if db_day in day_mapping and day_mapping[db_day] == expected_day:
                            g = getattr(r, 'gender')
                            age = getattr(r, 'age_group') or 'Other'
                            val = float(getattr(r, 'avg_sec') or 0)
                            s = float(getattr(r, 'sum_sec') or 0)
                            c = int(getattr(r, 'event_count') or 0)
                            if g not in ('male','female'):
                                continue
                            if metric_type == 'average':
                                gender_age[g][age] = round(val / 60.0, 2)
                                total_sum += val * c
                                total_cnt += c
                            else:
                                gender_age[g][age] = round(s / 60.0, 2)
                                total_sum += s
                                total_cnt += c
                    bucket['gender_age'] = { 'male': [ { 'age_group': k, 'minutes': v } for k, v in gender_age['male'].items() ], 'female': [ { 'age_group': k, 'minutes': v } for k, v in gender_age['female'].items() ] }
                    bucket['total_minutes'] = round((total_sum / total_cnt) / 60.0, 2) if metric_type == 'average' and total_cnt > 0 else round(total_sum / 60.0, 2)
                    bucket['sample_size'] = total_cnt
                data.append(bucket)

        return {
            'data': data,
            'parameters': {
                'view_type': view_type,
                'metric_type': metric_type,
                'breakdown': breakdown,
                'start_date': start_dt.date().isoformat(),
                'end_date': end_dt.date().isoformat(),
                'department': department,
                'store': store,
                'camera': camera,
            },
            'debug': {
                'rows': len(rows)
            }
        }
    except Exception as e:
        logger.error(f"Failed to get dwell-time time series: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")