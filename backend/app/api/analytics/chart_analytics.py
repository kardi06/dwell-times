"""
Chart Data Analytics Module

This module handles chart data for dwell time analytics and foot traffic analytics.
Endpoints:
- /chart-data: Get chart data for dwell time analytics with demographic breakdowns
- /foot-traffic-data: Get foot traffic analytics data for chart visualization
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import datetime, timedelta
import logging

from ...core.database import get_db
from ...models.camera_events import CameraEvent

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/chart-data")
async def get_chart_data(
    time_period: str = Query("week", description="Time period: day, week, month, quarter, year"),
    metric_type: str = Query("average", description="Metric type: total, average"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    camera: Optional[str] = Query(None),
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

        # Apply global hierarchy filters
        if department:
            query = query.filter(CameraEvent.department == department)
        if store:
            query = query.filter(CameraEvent.camera_group == store)
        if camera:
            query = query.filter(CameraEvent.camera_description == camera)
        
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
            gender_value = (row.gender or '').lower()
            if gender_value not in ('male','female'):
                continue
            chart_data.append({
                "age_group": row.age_group or "Other",
                "gender": gender_value,
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

@router.get("/foot-traffic-data")
async def get_foot_traffic_data(
    time_period: str = Query("day", description="Time period: day, weekly, monthly, yearly"),
    selected_date: str = Query(..., description="Selected date (YYYY-MM-DD)"),
    camera_filter: str = Query("all", description="Camera filter or 'all'"),
    view_type: str = Query("hourly", description="View type: hourly, daily"),
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    camera: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="Global start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Global end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get foot traffic analytics data for chart visualization"""
    try:
        # Validate parameters
        if time_period not in ["day", "weekly", "monthly", "yearly"]:
            raise HTTPException(status_code=400, detail="Invalid time_period. Must be day, weekly, monthly, or yearly")
        
        if view_type not in ["hourly", "daily"]:
            raise HTTPException(status_code=400, detail="Invalid view_type. Must be hourly or daily")
        
        # Parse selected date
        try:
            selected_dt = datetime.fromisoformat(selected_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid selected_date format. Use YYYY-MM-DD")

        # Parse global date range if provided
        start_dt_override = None
        end_dt_override = None
        if start_date:
            try:
                start_dt_override = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        if end_date:
            try:
                end_dt_override = datetime.fromisoformat(end_date)
                end_dt_override = end_dt_override.replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        # Build base query
        query = db.query(CameraEvent)
        
        # Apply hierarchy filters
        # Division filter intentionally not required by UI now; still supported if provided
        if division:
            query = query.filter(CameraEvent.division == division)
        if department:
            query = query.filter(CameraEvent.department == department)
        if store:
            query = query.filter(CameraEvent.camera_group == store)
        if camera:
            query = query.filter(CameraEvent.camera_description == camera)
        
        # Apply camera filter (legacy)
        if camera_filter != "all":
            query = query.filter(CameraEvent.camera_description == camera_filter)
        
        # Apply date filtering
        if start_dt_override and end_dt_override:
            query = query.filter(CameraEvent.utc_time_started_readable >= start_dt_override)
            query = query.filter(CameraEvent.utc_time_started_readable <= end_dt_override)
        else:
            if time_period == "day":
                start_dt = selected_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end_dt = selected_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
                query = query.filter(CameraEvent.utc_time_started_readable <= end_dt)
            elif time_period == "weekly":
                start_of_week = selected_dt - timedelta(days=selected_dt.weekday())
                start_dt = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
                end_dt = start_of_week + timedelta(days=6)
                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
                query = query.filter(CameraEvent.utc_time_started_readable <= end_dt)
            elif time_period == "monthly":
                start_dt = selected_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if selected_dt.month == 12:
                    end_dt = selected_dt.replace(year=selected_dt.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    end_dt = selected_dt.replace(month=selected_dt.month + 1, day=1) - timedelta(days=1)
                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
                query = query.filter(CameraEvent.utc_time_started_readable <= end_dt)
            elif time_period == "yearly":
                start_dt = selected_dt.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_dt = selected_dt.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
                query = query.filter(CameraEvent.utc_time_started_readable >= start_dt)
                query = query.filter(CameraEvent.utc_time_started_readable <= end_dt)

        # Build aggregation query based on view type
        if view_type == "hourly":
            # Hourly view: 10 AM to 10 PM (hours 10-22)
            query = query.filter(extract('hour', CameraEvent.utc_time_started_readable).between(10, 22))
            
            # Group by hour and gender
            agg_query = query.with_entities(
                extract('hour', CameraEvent.utc_time_started_readable).label('hour'),
                func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
                func.count(func.distinct(CameraEvent.person_id)).label('unique_count')
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(
                extract('hour', CameraEvent.utc_time_started_readable),
                func.coalesce(CameraEvent.gender_outcome, 'other')
            ).order_by(extract('hour', CameraEvent.utc_time_started_readable))
            
        else:  # daily view
            # Group by day of week and gender
            agg_query = query.with_entities(
                func.extract('dow', CameraEvent.utc_time_started_readable).label('day_of_week'),
                func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
                func.count(func.distinct(CameraEvent.person_id)).label('unique_count')
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(
                func.extract('dow', CameraEvent.utc_time_started_readable),
                func.coalesce(CameraEvent.gender_outcome, 'other')
            ).order_by(func.extract('dow', CameraEvent.utc_time_started_readable))
        
        # Execute query
        try:
            results = agg_query.all()
            logger.info(f"Foot traffic query results: {len(results)} records")
            for result in results:
                if view_type == "hourly":
                    logger.info(f"Result: hour={result.hour}, gender={result.gender}, count={result.unique_count}")
                else:
                    logger.info(f"Result: day={result.day_of_week}, gender={result.gender}, count={result.unique_count}")
        except Exception as query_error:
            logger.error(f"Query execution failed: {query_error}")
            logger.error(f"Query parameters: time_period={time_period}, selected_date={selected_date}, camera_filter={camera_filter}, view_type={view_type}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(query_error)}")
        
        # Process results into chart data format
        chart_data = []
        
        if view_type == "hourly":
            # Create data points for each hour (10 AM to 10 PM)
            hour_labels = ["10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM"]
            hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
            
            for i, hour in enumerate(hours):
                male_count = 0
                female_count = 0
                other_count = 0
                
                # Find data for this hour
                for result in results:
                    if result.hour == hour:
                        if result.gender == 'male':
                            male_count += result.unique_count
                        elif result.gender == 'female':
                            female_count = result.unique_count
                        else:
                            other_count = result.unique_count
                
                chart_data.append({
                    'time_period': hour_labels[i],
                    'male_count': male_count,
                    'female_count': female_count,
                    'other_count': other_count,
                    'total_count': male_count + female_count + other_count
                })
        else:
            # Create data points for each day of week
            day_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            # extract('dow') returns: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
            # Convert to our expected format: 0=Monday, 1=Tuesday, ..., 6=Sunday
            day_mapping = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}  # Sunday=6, Monday=0, etc.
            expected_days = [0, 1, 2, 3, 4, 5, 6]  # Monday=0, Tuesday=1, ..., Sunday=6
            
            for i, expected_day in enumerate(expected_days):
                male_count = 0
                female_count = 0
                other_count = 0
                
                # Find data for this day
                for result in results:
                    # Convert database extract('dow') day to our expected format
                    db_day = result.day_of_week
                    if db_day in day_mapping and day_mapping[db_day] == expected_day:
                        if result.gender == 'male':
                            male_count = result.unique_count
                        elif result.gender == 'female':
                            female_count = result.unique_count
                        else:
                            other_count = result.unique_count
                
                chart_data.append({
                    'time_period': day_labels[i],
                    'male_count': male_count,
                    'female_count': female_count,
                    'other_count': other_count,
                    'total_count': male_count + female_count + other_count
                })
        
        # Add debug information to response
        logger.info(f"Final chart data: {len(chart_data)} points")
        for point in chart_data:
            logger.info(f"Chart point: {point}")
        
        return {
            'data': chart_data,
            'parameters': {
                'time_period': time_period,
                'selected_date': selected_date,
                'camera_filter': camera_filter,
                'view_type': view_type
            },
            'debug': {
                'raw_results_count': len(results),
                'chart_points_count': len(chart_data),
                'query_info': f"Time period: {time_period}, View type: {view_type}, Camera: {camera_filter}"
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get foot traffic data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/foot-traffic-time-series")
async def get_foot_traffic_time_series(
    view_type: str = Query("hourly", description="View type: hourly or daily"),
    breakdown: str = Query("none", description="Breakdown: none, gender, age, gender_age"),
    department: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    camera: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Foot traffic series: distinct visitor counts grouped by hour (10-22) or day of week, with optional breakdowns."""
    try:
        if view_type not in ["hourly", "daily"]:
            raise HTTPException(status_code=400, detail="Invalid view_type. Must be hourly or daily")
        if breakdown not in ["none", "gender", "age", "gender_age"]:
            raise HTTPException(status_code=400, detail="Invalid breakdown. Must be none, gender, age, or gender_age")

        # Parse date range; default last 7 days
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

        # Time bucket expression
        if view_type == "hourly":
            query = query.filter(extract('hour', CameraEvent.utc_time_started_readable).between(10, 22))
            time_expr = extract('hour', CameraEvent.utc_time_started_readable).label('bucket')
        else:
            time_expr = func.extract('dow', CameraEvent.utc_time_started_readable).label('bucket')

        distinct_count = func.count(func.distinct(CameraEvent.person_id)).label('visitor_count')

        rows = []
        if breakdown in ("none", "gender"):
            q = query.with_entities(
                time_expr,
                func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
                distinct_count,
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(time_expr, func.coalesce(CameraEvent.gender_outcome, 'other')).order_by(time_expr)
            rows = q.all()
        elif breakdown == "age":
            q = query.with_entities(
                time_expr,
                func.coalesce(CameraEvent.age_group_outcome, 'Other').label('age_group'),
                distinct_count,
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(time_expr, func.coalesce(CameraEvent.age_group_outcome, 'Other')).order_by(time_expr)
            rows = q.all()
        else:  # gender_age
            q = query.with_entities(
                time_expr,
                func.coalesce(CameraEvent.gender_outcome, 'other').label('gender'),
                func.coalesce(CameraEvent.age_group_outcome, 'Other').label('age_group'),
                distinct_count,
            ).filter(
                func.lower(func.coalesce(CameraEvent.gender_outcome, 'other')).in_(['male','female'])
            ).group_by(
                time_expr,
                func.coalesce(CameraEvent.gender_outcome, 'other'),
                func.coalesce(CameraEvent.age_group_outcome, 'Other')
            ).order_by(time_expr)
            rows = q.all()

        data = []
        if view_type == "hourly":
            hour_labels = ["10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM"]
            hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
            for i, hour in enumerate(hours):
                bucket = { 'time_period': hour_labels[i] }
                if breakdown in ("none", "gender"):
                    male = female = 0
                    for r in rows:
                        if int(getattr(r, 'bucket')) == hour:
                            if r.gender == 'male':
                                male = int(getattr(r, 'visitor_count') or 0)
                            elif r.gender == 'female':
                                female = int(getattr(r, 'visitor_count') or 0)
                    bucket['male_count'] = male
                    bucket['female_count'] = female
                    bucket['total_count'] = male + female
                elif breakdown == "age":
                    ages = {}
                    total = 0
                    for r in rows:
                        if int(getattr(r, 'bucket')) == hour:
                            age = getattr(r, 'age_group') or 'Other'
                            if (age or '').lower() == 'inconclusive':
                                continue
                            count = int(getattr(r, 'visitor_count') or 0)
                            ages[age] = count
                            total += count
                    bucket['age_groups'] = [ { 'age_group': k, 'count': v } for k, v in ages.items() ]
                    bucket['total_count'] = total
                else:
                    gender_age = { 'male': {}, 'female': {} }
                    total = 0
                    for r in rows:
                        if int(getattr(r, 'bucket')) == hour:
                            g = getattr(r, 'gender')
                            age = getattr(r, 'age_group') or 'Other'
                            if (age or '').lower() == 'inconclusive':
                                continue
                            c = int(getattr(r, 'visitor_count') or 0)
                            if g in ('male','female'):
                                gender_age[g][age] = c
                                total += c
                    bucket['gender_age'] = { 'male': [ { 'age_group': k, 'count': v } for k, v in gender_age['male'].items() ], 'female': [ { 'age_group': k, 'count': v } for k, v in gender_age['female'].items() ] }
                    bucket['total_count'] = total
                data.append(bucket)
        else:
            day_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_mapping = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
            expected_days = [0,1,2,3,4,5,6]
            for i, expected_day in enumerate(expected_days):
                bucket = { 'time_period': day_labels[i] }
                if breakdown in ("none", "gender"):
                    male = female = 0
                    for r in rows:
                        db_day = int(getattr(r, 'bucket'))
                        if db_day in day_mapping and day_mapping[db_day] == expected_day:
                            if r.gender == 'male':
                                male = int(getattr(r, 'visitor_count') or 0)
                            elif r.gender == 'female':
                                female = int(getattr(r, 'visitor_count') or 0)
                    bucket['male_count'] = male
                    bucket['female_count'] = female
                    bucket['total_count'] = male + female
                elif breakdown == "age":
                    ages = {}
                    total = 0
                    for r in rows:
                        db_day = int(getattr(r, 'bucket'))
                        if db_day in day_mapping and day_mapping[db_day] == expected_day:
                            age = getattr(r, 'age_group') or 'Other'
                            if (age or '').lower() == 'inconclusive':
                                continue
                            count = int(getattr(r, 'visitor_count') or 0)
                            ages[age] = count
                            total += count
                    bucket['age_groups'] = [ { 'age_group': k, 'count': v } for k, v in ages.items() ]
                    bucket['total_count'] = total
                else:
                    gender_age = { 'male': {}, 'female': {} }
                    total = 0
                    for r in rows:
                        db_day = int(getattr(r, 'bucket'))
                        if db_day in day_mapping and day_mapping[db_day] == expected_day:
                            g = getattr(r, 'gender')
                            age = getattr(r, 'age_group') or 'Other'
                            if (age or '').lower() == 'inconclusive':
                                continue
                            c = int(getattr(r, 'visitor_count') or 0)
                            if g in ('male','female'):
                                gender_age[g][age] = c
                                total += c
                    bucket['gender_age'] = { 'male': [ { 'age_group': k, 'count': v } for k, v in gender_age['male'].items() ], 'female': [ { 'age_group': k, 'count': v } for k, v in gender_age['female'].items() ] }
                    bucket['total_count'] = total
                data.append(bucket)

        return {
            'data': data,
            'parameters': {
                'view_type': view_type,
                'breakdown': breakdown,
                'start_date': start_dt.date().isoformat(),
                'end_date': end_dt.date().isoformat(),
                'department': department,
                'store': store,
                'camera': camera,
            },
            'debug': { 'rows': len(rows) }
        }
    except Exception as e:
        logger.error(f"Failed to get foot-traffic time series: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 