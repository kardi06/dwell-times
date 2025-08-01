"""
Camera Management Analytics Module

This module handles camera management and listing.
Endpoints:
- /cameras: Get list of available camera descriptions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from ...core.database import get_db
from ...models.camera_events import CameraEvent

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/cameras")
async def get_cameras(db: Session = Depends(get_db)):
    """Get list of available camera descriptions"""
    try:
        # Query distinct camera descriptions
        cameras = db.query(CameraEvent.camera_description).distinct().filter(
            CameraEvent.camera_description.isnot(None)
        ).all()
        
        camera_list = [camera.camera_description for camera in cameras if camera.camera_description]
        
        return {
            'cameras': camera_list
        }
        
    except Exception as e:
        logger.error(f"Failed to get cameras: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 