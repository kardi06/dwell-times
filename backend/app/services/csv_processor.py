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
    """Handles CSV file processing for camera event data with dwell time calculation"""
    
    REQUIRED_COLUMNS = ['person_id', 'camera_id', 'camera_description', 'utc_time_started_readable', 'utc_time_ended_readable']
    VALID_EVENT_TYPES = ['entry', 'exit', 'loiter', 'crowd', 'appearance']
    
    # Map your timestamp columns to our expected format
    TIMESTAMP_COLUMNS = [
        'timestamp', 'utc_time_re', 'utc_time_st', 'utc_time_e', 'frame_time',
        'utc_time_received', 'utc_time_start', 'utc_time_end',
        'utc_time_recorded', 'utc_time_s', 'frame_time',
        'utc_time_started_readable', 'utc_time_ended_readable'
    ]
    
    # Demographic columns for story 1.6
    DEMOGRAPHIC_COLUMNS = ['age_group_outcome', 'gender_outcome']
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_csv_structure(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validate CSV structure and required columns"""
        errors = []
        
        # Debug: Log available columns
        logger.info(f"Available columns in CSV: {list(df.columns)}")
        
        # Check required columns
        missing_columns = set(self.REQUIRED_COLUMNS) - set(df.columns)
        if missing_columns:
            errors.append(f"Missing required columns: {missing_columns}")
        
        # Check for timestamp column (any of the allowed timestamp columns)
        timestamp_found = any(col in df.columns for col in self.TIMESTAMP_COLUMNS)
        if not timestamp_found:
            # Try to find any column that contains 'time' or 'timestamp'
            time_columns = [col for col in df.columns if 'time' in col.lower() or 'timestamp' in col.lower()]
            if time_columns:
                # Add found time columns to allowed list
                self.TIMESTAMP_COLUMNS.extend(time_columns)
                timestamp_found = True
                logger.info(f"Found time columns: {time_columns}")
            else:
                errors.append(f"Missing timestamp column. Expected one of: {self.TIMESTAMP_COLUMNS}")
                errors.append(f"Available columns: {list(df.columns)}")
        
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
    
    def process_demographic_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process demographic data with null/undefined to 'other' mapping"""
        # Handle age_group_outcome
        if 'age_group_outcome' in df.columns:
            # Map null/undefined values to "other"
            df['age_group_outcome'] = df['age_group_outcome'].fillna('other')
            # Also map empty strings and whitespace to "other"
            df['age_group_outcome'] = df['age_group_outcome'].apply(
                lambda x: 'other' if pd.isna(x) or str(x).strip() == '' else str(x).strip()
            )
        else:
            # If column doesn't exist, create it with "other" as default
            df['age_group_outcome'] = 'other'
        
        # Handle gender_outcome
        if 'gender_outcome' in df.columns:
            # Map null/undefined values to "other"
            df['gender_outcome'] = df['gender_outcome'].fillna('other')
            # Also map empty strings and whitespace to "other"
            df['gender_outcome'] = df['gender_outcome'].apply(
                lambda x: 'other' if pd.isna(x) or str(x).strip() == '' else str(x).strip()
            )
        else:
            # If column doesn't exist, create it with "other" as default
            df['gender_outcome'] = 'other'
        
        logger.info(f"Processed demographic data: age_group_outcome and gender_outcome mapped to 'other' for null values")
        return df
    
    def parse_timestamps(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse timestamps with multiple format support"""
        # Find the timestamp column to use
        timestamp_col = None
        for col in self.TIMESTAMP_COLUMNS:
            if col in df.columns:
                timestamp_col = col
                break
        
        if not timestamp_col:
            logger.warning("No timestamp column found, using current time")
            df['timestamp'] = pd.Timestamp.now()
            return df
        
        # Convert Unix timestamps (scientific notation) to datetime
        try:
            # Handle scientific notation (e.g., 1.754E+09)
            if df[timestamp_col].dtype == 'object':
                # Convert scientific notation to float first
                df['timestamp'] = pd.to_numeric(df[timestamp_col], errors='coerce')
            
            # Convert Unix timestamp to datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s', errors='coerce')
            
            # Fill any NaT values with current time
            df['timestamp'] = df['timestamp'].fillna(pd.Timestamp.now())
            
            logger.info(f"Successfully parsed timestamps from column: {timestamp_col}")
            
        except Exception as e:
            logger.error(f"Failed to parse timestamps from {timestamp_col}: {e}")
            # Fallback to current time
            df['timestamp'] = pd.Timestamp.now()
        
        return df
    
    def calculate_dwell_time(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate dwell time from utc_time_started_readable and utc_time_ended_readable"""
        if 'utc_time_started_readable' in df.columns and 'utc_time_ended_readable' in df.columns:
            try:
                # Parse timestamps
                df['start_time'] = pd.to_datetime(df['utc_time_started_readable'], errors='coerce')
                df['end_time'] = pd.to_datetime(df['utc_time_ended_readable'], errors='coerce')
                
                # Calculate dwell time in seconds
                df['dwell_time'] = (df['end_time'] - df['start_time']).dt.total_seconds()
                
                # Fill NaN values with 0
                df['dwell_time'] = df['dwell_time'].fillna(0)
                
                logger.info(f"Calculated dwell time for {len(df)} records")
                return df
            except Exception as e:
                logger.error(f"Error calculating dwell time: {e}")
                df['dwell_time'] = 0
                return df
        else:
            logger.warning("Required timestamp columns not found for dwell time calculation")
            df['dwell_time'] = 0
            return df
    
    def clean_and_prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare data for database insertion with dwell time calculation"""
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Sort by timestamp if available
        if 'timestamp' in df.columns:
            df = df.sort_values('timestamp')
        
        # Process demographic data
        df = self.process_demographic_data(df)
        
        # Calculate dwell time
        df = self.calculate_dwell_time(df)
        
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
            # Convert timestamp to processed_timestamp
            processed_timestamp = None
            if 'timestamp' in row and pd.notna(row['timestamp']):
                processed_timestamp = row['timestamp']
            
            event = CameraEvent(
                # Core fields
                person_id=str(row.get('person_id', '')),
                retain=row.get('retain', False),
                appearance_labeled_ou_event=row.get('appearance_labeled_ou_event'),
                event_type=str(row.get('event_type', '')),
                event_id=row.get('event_id'),
                
                # Timestamp fields
                utc_time_recorded=row.get('utc_time_recorded'),
                utc_time_recorded_readable=row.get('utc_time_recorded_readable'),
                utc_time_started_readable=row.get('utc_time_started_readable'),
                utc_time_ended_readable=row.get('utc_time_ended_readable'),
                # appearance_utc_time_s=row.get('appearance_utc_time_s'),
                # utc_time_s=row.get('utc_time_s'),
                # utc_time_e=row.get('utc_time_e'),
                # utc_time_e_first_frame_last=row.get('utc_time_e_first_frame_last'),
                
                # Frame information
                first_frame=row.get('first_frame'),
                last_frame_attributes=row.get('last_frame_attributes'),
                
                # Camera information
                camera_id=str(row.get('camera_id', '')),
                camera_de_node_id=row.get('camera_de_node_id'),
                camera_description=row.get('camera_description'),
                
                # Analysis fields
                analysis_m_record_face=row.get('analysis_m_record_face'),
                matching_camera=row.get('matching_camera'),
                camera_grc=row.get('camera_grc'),
                camera_grc_zone_name=row.get('camera_grc_zone_name'),
                
                # Zone information
                zone_id=row.get('zone_id'),
                zone_verific_face_score=row.get('zone_verific_face_score'),
                zone_name=row.get('zone_name'),
                
                # Frame details
                frame_id=row.get('frame_id'),
                frame_time=row.get('frame_time'),
                
                # Bounding box coordinates
                bbox_x1=row.get('bbox_x1'),
                bbox_y1=row.get('bbox_y1'),
                bbox_x2=row.get('bbox_x2'),
                bbox_y2=row.get('bbox_y2'),
                
                # Watchlist information
                watchlist_ty=row.get('watchlist_ty'),
                watchlist_d=row.get('watchlist_d'),
                watchlist_g_match=row.get('watchlist_g_match'),
                
                # Demographics (existing)
                out_age_group=row.get('out_age_group'),
                gender=row.get('gender'),
                out_liveness=row.get('out_liveness'),
                
                # Enhanced demographics (new for story 1.6)
                age_group_outcome=row.get('age_group_outcome'),
                gender_outcome=row.get('gender_outcome'),
                
                # Calculated fields
                session_id=row.get('session_id'),
                dwell_time=row.get('dwell_time', 0),  # Pre-calculated dwell time
                is_entry=row.get('is_entry'),
                is_exit=row.get('is_exit'),
                processed_timestamp=processed_timestamp,
                
                # Raw data
                raw_data=row.to_json()
            )
            events.append(event)
        
        # Bulk insert for performance
        self.db.bulk_save_objects(events)
        self.db.commit() 