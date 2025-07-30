import pytest
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from unittest.mock import Mock, patch
import tempfile
import os

from app.services.csv_processor import CSVProcessor
from app.services.dwell_time_engine import DwellTimeEngine
from app.services.analytics_service import AnalyticsService
from app.models.camera_events import CameraEvent, PersonSession
from app.core.exceptions import DataValidationError, ProcessingError, AnalyticsError

class TestCSVProcessor:
    """Test CSV processing functionality"""
    
    def test_validate_csv_structure_valid(self, db_session):
        """Test CSV structure validation with valid data"""
        processor = CSVProcessor(db_session)
        
        # Create valid test data
        test_data = {
            'timestamp': ['2024-01-01 10:00:00', '2024-01-01 10:01:00'],
            'person_id': ['person1', 'person2'],
            'camera_id': ['camera1', 'camera1'],
            'event_type': ['entry', 'exit']
        }
        df = pd.DataFrame(test_data)
        
        is_valid, errors = processor.validate_csv_structure(df)
        assert is_valid
        assert len(errors) == 0
    
    def test_validate_csv_structure_missing_columns(self, db_session):
        """Test CSV structure validation with missing columns"""
        processor = CSVProcessor(db_session)
        
        # Create invalid test data (missing required columns)
        test_data = {
            'timestamp': ['2024-01-01 10:00:00'],
            'person_id': ['person1']
            # Missing camera_id and event_type
        }
        df = pd.DataFrame(test_data)
        
        is_valid, errors = processor.validate_csv_structure(df)
        assert not is_valid
        assert len(errors) > 0
        assert 'Missing required columns' in errors[0]
    
    def test_validate_data_quality_valid(self, db_session):
        """Test data quality validation with valid data"""
        processor = CSVProcessor(db_session)
        
        # Create valid test data
        test_data = {
            'timestamp': ['2024-01-01 10:00:00', '2024-01-01 10:01:00'],
            'person_id': ['person1', 'person2'],
            'camera_id': ['camera1', 'camera1'],
            'event_type': ['entry', 'exit']
        }
        df = pd.DataFrame(test_data)
        
        is_valid, errors = processor.validate_data_quality(df)
        assert is_valid
        assert len(errors) == 0
    
    def test_validate_data_quality_invalid_events(self, db_session):
        """Test data quality validation with invalid event types"""
        processor = CSVProcessor(db_session)
        
        # Create test data with invalid event types
        test_data = {
            'timestamp': ['2024-01-01 10:00:00', '2024-01-01 10:01:00'],
            'person_id': ['person1', 'person2'],
            'camera_id': ['camera1', 'camera1'],
            'event_type': ['entry', 'invalid_event']
        }
        df = pd.DataFrame(test_data)
        
        is_valid, errors = processor.validate_data_quality(df)
        assert not is_valid
        assert len(errors) > 0
        assert 'Invalid event types' in errors[0]
    
    def test_parse_timestamps(self, db_session):
        """Test timestamp parsing functionality"""
        processor = CSVProcessor(db_session)
        
        # Test data with different timestamp formats
        test_data = {
            'timestamp': ['2024-01-01 10:00:00', '2024-01-01T10:01:00'],
            'person_id': ['person1', 'person2'],
            'camera_id': ['camera1', 'camera1'],
            'event_type': ['entry', 'exit']
        }
        df = pd.DataFrame(test_data)
        
        result_df = processor.parse_timestamps(df)
        assert 'timestamp' in result_df.columns
        assert result_df['timestamp'].dtype == 'datetime64[ns]'

class TestDwellTimeEngine:
    """Test dwell time calculation functionality"""
    
    def test_calculate_dwell_times_no_events(self, db_session):
        """Test dwell time calculation with no events"""
        engine = DwellTimeEngine(db_session)
        
        result = engine.calculate_dwell_times()
        assert result['sessions_processed'] == 0
        assert result['total_dwell_time'] == 0
    
    def test_calculate_dwell_times_with_events(self, db_session):
        """Test dwell time calculation with valid events"""
        engine = DwellTimeEngine(db_session)
        
        # Create test events
        events = [
            CameraEvent(
                timestamp=datetime(2024, 1, 1, 10, 0, 0),
                person_id='person1',
                camera_id='camera1',
                event_type='entry'
            ),
            CameraEvent(
                timestamp=datetime(2024, 1, 1, 10, 5, 0),
                person_id='person1',
                camera_id='camera1',
                event_type='exit'
            )
        ]
        
        for event in events:
            db_session.add(event)
        db_session.commit()
        
        result = engine.calculate_dwell_times()
        assert result['sessions_processed'] == 1
        assert result['total_dwell_time'] == 300  # 5 minutes = 300 seconds
    
    def test_get_dwell_time_analytics(self, db_session):
        """Test dwell time analytics retrieval"""
        engine = DwellTimeEngine(db_session)
        
        # Create test sessions
        sessions = [
            PersonSession(
                session_id='session1',
                person_id='person1',
                camera_id='camera1',
                entry_time=datetime(2024, 1, 1, 10, 0, 0),
                exit_time=datetime(2024, 1, 1, 10, 5, 0),
                dwell_duration=300
            )
        ]
        
        for session in sessions:
            db_session.add(session)
        db_session.commit()
        
        result = engine.get_dwell_time_analytics(group_by='person')
        assert 'groups' in result
        assert 'summary' in result

class TestAnalyticsService:
    """Test analytics computation functionality"""
    
    def test_calculate_kpi_metrics_no_data(self, db_session):
        """Test KPI calculation with no data"""
        service = AnalyticsService(db_session)
        
        metrics = service.calculate_kpi_metrics()
        assert metrics['total_unique_visitors'] == 0
        assert metrics['total_events_processed'] == 0
        assert metrics['active_cameras_count'] == 0
    
    def test_calculate_kpi_metrics_with_data(self, db_session):
        """Test KPI calculation with test data"""
        service = AnalyticsService(db_session)
        
        # Create test events
        events = [
            CameraEvent(
                timestamp=datetime(2024, 1, 1, 10, 0, 0),
                person_id='person1',
                camera_id='camera1',
                event_type='entry'
            ),
            CameraEvent(
                timestamp=datetime(2024, 1, 1, 10, 5, 0),
                person_id='person1',
                camera_id='camera1',
                event_type='exit'
            )
        ]
        
        for event in events:
            db_session.add(event)
        db_session.commit()
        
        metrics = service.calculate_kpi_metrics()
        assert metrics['total_unique_visitors'] == 1
        assert metrics['total_events_processed'] == 2
        assert metrics['active_cameras_count'] == 1
    
    def test_calculate_occupancy_analytics(self, db_session):
        """Test occupancy analytics calculation"""
        service = AnalyticsService(db_session)
        
        # Create test sessions
        sessions = [
            PersonSession(
                session_id='session1',
                person_id='person1',
                camera_id='camera1',
                entry_time=datetime(2024, 1, 1, 10, 0, 0),
                exit_time=datetime(2024, 1, 1, 10, 5, 0),
                dwell_duration=300
            )
        ]
        
        for session in sessions:
            db_session.add(session)
        db_session.commit()
        
        result = service.calculate_occupancy_analytics(time_period='hour')
        assert 'occupancy_data' in result
        assert 'summary' in result
    
    def test_calculate_repeat_visitor_stats(self, db_session):
        """Test repeat visitor statistics calculation"""
        service = AnalyticsService(db_session)
        
        # Create test sessions for same person
        sessions = [
            PersonSession(
                session_id='session1',
                person_id='person1',
                camera_id='camera1',
                entry_time=datetime(2024, 1, 1, 10, 0, 0),
                exit_time=datetime(2024, 1, 1, 10, 5, 0),
                dwell_duration=300
            ),
            PersonSession(
                session_id='session2',
                person_id='person1',
                camera_id='camera1',
                entry_time=datetime(2024, 1, 2, 10, 0, 0),
                exit_time=datetime(2024, 1, 2, 10, 5, 0),
                dwell_duration=300
            )
        ]
        
        for session in sessions:
            db_session.add(session)
        db_session.commit()
        
        result = service.calculate_repeat_visitor_stats()
        assert result['unique_visitors'] == 1
        assert result['repeat_visitors'] == 1
        assert result['repeat_rate'] == 100.0

@pytest.fixture
def db_session():
    """Create a test database session"""
    # This would need to be configured based on your test setup
    # For now, we'll use a mock session
    session = Mock()
    session.query.return_value.filter.return_value.all.return_value = []
    session.query.return_value.with_entities.return_value.scalar.return_value = 0
    session.query.return_value.count.return_value = 0
    session.add = Mock()
    session.commit = Mock()
    return session 