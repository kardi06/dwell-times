"""
Waiting Time Analytics Module

This module handles waiting time analytics for people waiting more than 10 minutes.
Endpoints:
- /waiting-time: Get waiting time analytics data filtered for dwell_time > 10 minutes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from ...core.database import get_db
from ...models.camera_events import CameraEvent
from ...core.exceptions import ProcessingError

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/waiting-time")
async def get_waiting_time_analytics(
    view_type: str = Query("hourly", description="View type: hourly or daily"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    camera_ids: Optional[str] = Query(None, description="Comma-separated camera IDs"),
    camera_groups: Optional[str] = Query(None, description="Comma-separated camera groups"),
    db: Session = Depends(get_db)
):
    """Get waiting time analytics data for people waiting more than 10 minutes"""
    try:
        # Validate view_type parameter
        if view_type not in ["hourly", "daily"]:
            raise HTTPException(status_code=400, detail="Invalid view_type. Must be hourly or daily")
        
        # Parse date parameters
        start_dt = None
        end_dt = None
        print("API waiting-time params:", start_date, end_date, camera_ids, camera_groups)
        # if not start_date or not end_date:
        #     raise HTTPException(status_code=400, detail="start_date and end_date are required")
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
        
        # Parse camera filters
        # camera_id_list = None
        # if camera_ids:
        #     camera_id_list = [cid.strip() for cid in camera_ids.split(",") if cid.strip()]
        
        # camera_group_list = None
        # if camera_groups:
        #     camera_group_list = [cg.strip() for cg in camera_groups.split(",") if cg.strip()]
        # 3) Parse camera filters
        camera_id_list = [cid.strip() for cid in camera_ids.split(",") if cid.strip()] if camera_ids else None

        camera_group_list = [cg.strip() for cg in camera_groups.split(",") if cg.strip()] if camera_groups else None
        
        # Build query filters
        filters = [CameraEvent.dwell_time > 600]  # More than 10 minutes (600 seconds)
        
        if start_dt:
            filters.append(CameraEvent.utc_time_started_readable >= start_dt)
        
        if end_dt:
            # Add one day to include the end date
            end_dt_plus_one = end_dt + timedelta(days=1)
            filters.append(CameraEvent.utc_time_started_readable < end_dt_plus_one)
        
        if camera_id_list:
            filters.append(CameraEvent.camera_id.in_(camera_id_list))
        
        if camera_group_list:
            filters.append(CameraEvent.camera_group.in_(camera_group_list))
        
        # Determine time truncation based on view_type
        if view_type == "hourly":
            time_trunc = func.date_trunc('hour', CameraEvent.utc_time_started_readable)
        else:  # daily
            time_trunc = func.date_trunc('day', CameraEvent.utc_time_started_readable)
        
        # Build the query
        # query = db.query(
        #     time_trunc.label('time_period'),
        #     CameraEvent.camera_group,
        #     CameraEvent.camera_description,
        #     func.count(func.distinct(CameraEvent.person_id)).label('waiting_count')
        # ).filter(
        #     and_(*filters)
        # ).group_by(
        #     time_trunc,
        #     CameraEvent.camera_group,
        #     CameraEvent.camera_description
        # ).order_by(
        #     time_trunc
        # )

        # Decide whether to group by camera_group or not
        select_columns = [time_trunc.label('time_period')]
        grouping_columns = []
        # If they asked to filter by specific camera_groups, keep per-group breakdown
        if camera_group_list:
            grouping_columns += [CameraEvent.camera_group, CameraEvent.camera_description]
            select_columns += [CameraEvent.camera_group, CameraEvent.camera_description]

        # Always count distinct persons
        select_columns.append(
            func.count(func.distinct(CameraEvent.person_id)).label('waiting_count')
        )

        query = (
            db.query(*select_columns)
                .filter(and_(*filters))
                .group_by(time_trunc, *grouping_columns)
                .order_by(time_trunc)
            )

        print(query.statement)
        
        # Execute query
        results = query.all()
        
        # Transform results to match API specification
        data = []
        # for result in results:
        #     # Format time_period based on view_type
        #     if view_type == "hourly":
        #         time_period_str = result.time_period.strftime('%Y-%m-%d %H:00:00')
        #     else:
        #         time_period_str = result.time_period.strftime('%Y-%m-%d')
            
        #     data.append({
        #         "time_period": time_period_str,
        #         "waiting_count": result.waiting_count,
        #         "camera_info": {
        #             "camera_description": result.camera_description,
        #             "camera_group": result.camera_group
        #         }
        #     })
        for row in results:
            raw_tp = row.time_period
            if view_type == "hourly":
                time_period_str = raw_tp.strftime('%Y-%m-%d %H:00:00')
            else:
                time_period_str = raw_tp.strftime('%Y-%m-%d')

            item = {
                "time_period": time_period_str,
                "waiting_count": row.waiting_count,
            }
            if camera_group_list:
                item["camera_info"] = {
                    "camera_group": row.camera_group,
                    "camera_description": row.camera_description,
                }
            else:
                # Tambahkan agar frontend bisa group-by "All"
                item["camera_info"] = {
                    "camera_group": "All",
                    "camera_description": "",
                }
            data.append(item)
        
        # Calculate metadata
        total_records = sum(item["waiting_count"] for item in data)
        
        # Get time range from data
        time_range = {"start": None, "end": None}
        if data:
            time_periods = [item["time_period"] for item in data]
            time_range["start"] = min(time_periods)
            time_range["end"] = max(time_periods)
        
        return {
            "data": data,
            "metadata": {
                "total_records": total_records,
                "filtered_records": total_records,
                "time_range": time_range,
                "parameters": {
                    "view_type": view_type,
                    "start_date": start_date,
                    "end_date": end_date,
                    "camera_ids": camera_ids,
                    "camera_groups": camera_groups
                }
            }
        }
        
    except ProcessingError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Waiting time analytics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    # except HTTPException as e:
    #     logger.error(f"Waiting time analytics retrieval failed: {e}")
    #     raise HTTPException(status_code=500, detail="Internal server error")
        