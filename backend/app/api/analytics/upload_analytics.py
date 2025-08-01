"""
File Upload & Processing Analytics Module

This module handles CSV file uploads and dwell time calculations.
Endpoints:
- /upload-csv: Upload and process CSV camera event data
- /calculate-dwell-times: Manually trigger dwell time calculations
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import tempfile
import os
import logging

from ...core.database import get_db
from ...services.csv_processor import CSVProcessor
from ...services.dwell_time_engine import DwellTimeEngine
from ...services.analytics_service import AnalyticsService
from ...core.exceptions import DataValidationError, ProcessingError, AnalyticsError

logger = logging.getLogger(__name__)

router = APIRouter()

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