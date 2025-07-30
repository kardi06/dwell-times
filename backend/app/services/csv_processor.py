import pandas as pd
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from ..models.camera_events import CameraEvent
from ..core.exceptions import DataValidationError

logger = logging.getLogger(__name__)

class CSVProcessor:
    """Handles CSV file processing for camera event data"""
    
    REQUIRED_COLUMNS = ['timestamp', 'person_id', 'camera_id', 'event_type']
    VALID_EVENT_TYPES = ['entry', 'exit', 'loiter', 'crowd']
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_csv_structure(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validate CSV structure and required columns"""
        errors = []
        
        # Check required columns
        missing_columns = set(self.REQUIRED_COLUMNS) - set(df.columns)
        if missing_columns:
            errors.append(f"Missing required columns: {missing_columns}")
        
        # Check for empty dataframe
        if df.empty:
            errors.append("CSV file is empty")
        
        return len(errors) == 0, errors
    
    def validate_data_quality(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validate data quality and content"""
        errors = []
        
        # Check for missing values in required columns
        for col in self.REQUIRED_COLUMNS:
            if col in df.columns:
                missing_count = df[col].isnull().sum()
                if missing_count > 0:
                    errors.append(f"Column '{col}' has {missing_count} missing values")
        
        # Validate event types
        if 'event_type' in df.columns:
            invalid_events = df[~df['event_type'].isin(self.VALID_EVENT_TYPES)]
            if not invalid_events.empty:
                invalid_types = invalid_events['event_type'].unique()
                errors.append(f"Invalid event types found: {invalid_types}")
        
        # Validate timestamp format
        if 'timestamp' in df.columns:
            try:
                pd.to_datetime(df['timestamp'], errors='coerce')
                invalid_timestamps = df[pd.to_datetime(df['timestamp'], errors='coerce').isnull()]
                if not invalid_timestamps.empty:
                    errors.append(f"Found {len(invalid_timestamps)} invalid timestamp values")
            except Exception as e:
                errors.append(f"Timestamp parsing error: {str(e)}")
        
        return len(errors) == 0, errors
    
    def parse_timestamps(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse timestamps with multiple format support"""
        if 'timestamp' not in df.columns:
            return df
        
        # Try common timestamp formats
        timestamp_formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%S.%f',
            '%Y-%m-%d %H:%M:%S.%f',
            '%Y-%m-%d',
            '%m/%d/%Y %H:%M:%S',
            '%d/%m/%Y %H:%M:%S'
        ]
        
        for fmt in timestamp_formats:
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'], format=fmt)
                logger.info(f"Successfully parsed timestamps using format: {fmt}")
                break
            except:
                continue
        else:
            # Try automatic parsing as fallback
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                logger.info("Successfully parsed timestamps using automatic detection")
            except Exception as e:
                logger.error(f"Failed to parse timestamps: {e}")
                raise DataValidationError(f"Unable to parse timestamp column: {e}")
        
        return df
    
    def clean_and_prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare data for database insertion"""
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        # Add calculated fields
        df['is_entry'] = df['event_type'] == 'entry'
        df['is_exit'] = df['event_type'] == 'exit'
        
        # Generate session IDs for entry events
        df['session_id'] = None
        entry_mask = df['event_type'] == 'entry'
        df.loc[entry_mask, 'session_id'] = [
            f"{row['person_id']}_{row['camera_id']}_{uuid.uuid4().hex[:8]}_{i}"
            for i, (_, row) in enumerate(df[entry_mask].iterrows())
        ]
        
        return df
    
    def process_csv_file(self, file_path: str, chunk_size: int = 1000) -> Dict:
        """Process CSV file with progress tracking and error handling"""
        logger.info(f"Starting CSV processing for file: {file_path}")
        
        try:
            # Read CSV in chunks for large files
            chunk_reader = pd.read_csv(file_path, chunksize=chunk_size)
            total_rows = 0
            processed_rows = 0
            errors = []
            
            # First pass: validate structure and count rows
            logger.info("Validating CSV structure...")
            first_chunk = next(pd.read_csv(file_path, chunksize=chunk_size))
            
            # Validate structure
            is_valid, structure_errors = self.validate_csv_structure(first_chunk)
            if not is_valid:
                raise DataValidationError(f"CSV structure validation failed: {structure_errors}")
            
            # Count total rows
            total_rows = sum(1 for _ in pd.read_csv(file_path, chunksize=chunk_size)) * chunk_size
            
            # Second pass: process data
            logger.info("Processing CSV data...")
            for chunk_num, chunk in enumerate(pd.read_csv(file_path, chunksize=chunk_size)):
                try:
                    # Validate data quality
                    is_valid, quality_errors = self.validate_data_quality(chunk)
                    if quality_errors:
                        errors.extend(quality_errors)
                        logger.warning(f"Data quality issues in chunk {chunk_num}: {quality_errors}")
                    
                    # Parse timestamps
                    chunk = self.parse_timestamps(chunk)
                    
                    # Clean and prepare data
                    chunk = self.clean_and_prepare_data(chunk)
                    
                    # Insert into database
                    self._insert_chunk(chunk)
                    
                    processed_rows += len(chunk)
                    logger.info(f"Processed chunk {chunk_num + 1}: {len(chunk)} rows")
                    
                except Exception as e:
                    logger.error(f"Error processing chunk {chunk_num}: {e}")
                    errors.append(f"Chunk {chunk_num} processing error: {str(e)}")
            
            # Calculate processing statistics
            success_rate = (processed_rows / total_rows * 100) if total_rows > 0 else 0
            
            result = {
                'total_rows': total_rows,
                'processed_rows': processed_rows,
                'success_rate': success_rate,
                'errors': errors,
                'file_path': file_path
            }
            
            logger.info(f"CSV processing completed: {processed_rows}/{total_rows} rows processed ({success_rate:.1f}% success rate)")
            return result
            
        except Exception as e:
            logger.error(f"CSV processing failed: {e}")
            raise DataValidationError(f"CSV processing failed: {str(e)}")
    
    def _insert_chunk(self, df: pd.DataFrame):
        """Insert a chunk of data into the database"""
        events = []
        
        for _, row in df.iterrows():
            event = CameraEvent(
                timestamp=row['timestamp'],
                person_id=str(row['person_id']),
                camera_id=str(row['camera_id']),
                event_type=row['event_type'],
                session_id=row.get('session_id'),
                is_entry=row.get('is_entry'),
                is_exit=row.get('is_exit'),
                raw_data=row.to_json()
            )
            events.append(event)
        
        # Bulk insert for performance
        self.db.bulk_save_objects(events)
        self.db.commit() 