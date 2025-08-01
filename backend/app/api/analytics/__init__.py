"""
Analytics API package for Dwell-Insight platform.

This package contains modular analytics endpoints organized by domain:
- upload_analytics: File upload and processing
- kpi_analytics: KPI and basic analytics
- occupancy_analytics: Occupancy analytics
- dwell_time_analytics: Dwell time analytics
- event_analytics: Event management
- demographic_analytics: Demographic analytics
- chart_analytics: Chart data endpoints
- camera_analytics: Camera management
"""

from .router import router

__all__ = ["router"] 