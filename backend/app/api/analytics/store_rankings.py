from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from ...core.database import get_db
from ...models.camera_events import CameraEvent

logger = logging.getLogger(__name__)

router = APIRouter()


def _parse_dates(start_date: Optional[str], end_date: Optional[str]):
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
	# Default to last 7 days if not provided
	if not start_dt or not end_dt:
		now = datetime.now()
		end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
		start_dt = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
	return start_dt, end_dt


@router.get("/store-rankings")
async def get_store_rankings(
	metric: str = Query("visitors", description="Metric: visitors|dwell_total|dwell_avg|wait_10m|repeat_rate|momentum|underperformers"),
	order: Optional[str] = Query(None, description="asc|desc"),
	limit: int = Query(5, ge=1, le=50),
	division: Optional[str] = Query(None),
	department: Optional[str] = Query(None),
	start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
	end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
	db: Session = Depends(get_db)
):
	"""Return store rankings for the requested metric. Implements 'visitors' and 'dwell_avg'."""
	try:
		start_dt, end_dt = _parse_dates(start_date, end_date)

		if metric not in ["visitors", "dwell_total", "dwell_avg", "wait_10m", "repeat_rate", "momentum", "underperformers"]:
			raise HTTPException(status_code=400, detail="Invalid metric")

		# Base filter
		base = db.query(CameraEvent).filter(CameraEvent.utc_time_started_readable.isnot(None))
		if division:
			base = base.filter(CameraEvent.division == division)
		if department:
			base = base.filter(CameraEvent.department == department)
		base = base.filter(CameraEvent.utc_time_started_readable >= start_dt)
		base = base.filter(CameraEvent.utc_time_started_readable <= end_dt)

		rows: List[dict] = []
		metric_key = metric
		order_dir = order

		if metric == "visitors":
			# Step 1: count distinct persons per store per day within range
			per_day = base.with_entities(
				CameraEvent.camera_group.label("store"),
				func.date(CameraEvent.utc_time_started_readable).label("day"),
				func.count(func.distinct(CameraEvent.person_id)).label("daily_visitors"),
			).group_by(
				CameraEvent.camera_group,
				func.date(CameraEvent.utc_time_started_readable),
			)
			# Step 2: sum over period for each store
			per_day_sq = per_day.subquery()
			summed = db.query(
				per_day_sq.c.store,
				func.sum(per_day_sq.c.daily_visitors).label("value"),
			).group_by(per_day_sq.c.store)
			# Sort
			if order_dir is None:
				order_dir = "desc"
			if order_dir == "asc":
				summed = summed.order_by(func.sum(per_day_sq.c.daily_visitors).asc())
			else:
				summed = summed.order_by(func.sum(per_day_sq.c.daily_visitors).desc())
			# Limit
			results = summed.limit(limit).all()
			# Shape
			rows = [
				{
					"store": r[0] or "Unknown",
					"division": division or None,
					"department": department or None,
					"value": int(r[1] or 0),
					"delta": 0.0,
				}
				for r in results
			]
			metric_key = "visitors"

		elif metric == "dwell_avg":
			# Average dwell_time per store across the period (seconds)
			q = base.with_entities(
				CameraEvent.camera_group.label("store"),
				func.avg(CameraEvent.dwell_time).label("avg_dwell_sec"),
			).filter(CameraEvent.dwell_time.isnot(None)).group_by(CameraEvent.camera_group)
			# Sorting default for 'bottom' lists is asc if not provided
			if order_dir is None:
				order_dir = "asc"
			if order_dir == "asc":
				q = q.order_by(func.avg(CameraEvent.dwell_time).asc())
			else:
				q = q.order_by(func.avg(CameraEvent.dwell_time).desc())
			results = q.limit(limit).all()
			rows = [
				{
					"store": r[0] or "Unknown",
					"division": division or None,
					"department": department or None,
					"value": float(r[1] or 0.0),
					"delta": 0.0,
				}
				for r in results
			]
			metric_key = "dwell_avg"

		# TODO: implement dwell_total, wait_10m, repeat_rate, momentum, underperformers

		return {
			"metric": metric_key,
			"rows": rows,
			"parameters": {
				"division": division,
				"department": department,
				"start_date": start_dt.date().isoformat() if start_dt else None,
				"end_date": end_dt.date().isoformat() if end_dt else None,
				"limit": limit,
				"order": order_dir,
			},
		}
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"Failed to get store rankings: {e}")
		raise HTTPException(status_code=500, detail="Internal server error")
