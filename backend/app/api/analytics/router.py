"""
Main Analytics Router

This module serves as the main router for all analytics endpoints.
It imports and includes all sub-routers to maintain the same API structure.
"""

from fastapi import APIRouter

from .upload_analytics import router as upload_router
from .kpi_analytics import router as kpi_router
from .occupancy_analytics import router as occupancy_router
from .dwell_time_analytics import router as dwell_router
from .event_analytics import router as event_router
from .demographic_analytics import router as demographic_router
from .chart_analytics import router as chart_router
from .camera_analytics import router as camera_router
from .filter_analytics import router as filter_router
from .waiting_time_analytics import router as waiting_time_router
from .store_rankings import router as store_rankings_router

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

# Include all sub-routers
router.include_router(upload_router)
router.include_router(kpi_router)
router.include_router(occupancy_router)
router.include_router(dwell_router)
router.include_router(event_router)
router.include_router(demographic_router)
router.include_router(chart_router)
router.include_router(camera_router)
router.include_router(filter_router)
router.include_router(waiting_time_router)
router.include_router(store_rankings_router) 