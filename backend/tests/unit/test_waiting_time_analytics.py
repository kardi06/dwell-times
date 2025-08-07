"""
Unit tests for waiting time analytics endpoint
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.core.database import get_db, Base
from app.models.camera_events import CameraEvent

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)

@pytest.fixture
def sample_camera_events(db_session):
    """Create sample camera events for testing"""
    events = []
    
    # Create events with dwell_time > 10 minutes (600 seconds)
    base_time = datetime(2024, 1, 1, 10, 0, 0)
    
    for i in range(5):
        event = CameraEvent(
            person_id=f"person_{i}",
            event_type="appearance",
            camera_id=f"camera_{i % 2}",
            camera_description=f"Camera {i % 2}",
            camera_group=f"Group {i % 2}",
            dwell_time=700 + i * 50,  # All > 600 seconds
            utc_time_started_readable=base_time + timedelta(hours=i),
            retain=True
        )
        events.append(event)
    
    # Create events with dwell_time < 10 minutes (should be filtered out)
    for i in range(3):
        event = CameraEvent(
            person_id=f"short_person_{i}",
            event_type="appearance",
            camera_id=f"camera_{i}",
            camera_description=f"Camera {i}",
            camera_group=f"Group {i}",
            dwell_time=300 + i * 50,  # All < 600 seconds
            utc_time_started_readable=base_time + timedelta(hours=i),
            retain=True
        )
        events.append(event)
    
    db_session.add_all(events)
    db_session.commit()
    return events

def test_waiting_time_analytics_basic(client, sample_camera_events):
    """Test basic waiting time analytics endpoint"""
    response = client.get("/api/v1/analytics/waiting-time")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "data" in data
    assert "metadata" in data
    assert "total_records" in data["metadata"]
    
    # Should only include events with dwell_time > 600 seconds
    assert data["metadata"]["total_records"] == 5  # Only the 5 long-dwell events

def test_waiting_time_analytics_with_date_filter(client, sample_camera_events):
    """Test waiting time analytics with date filtering"""
    response = client.get("/api/v1/analytics/waiting-time", params={
        "start_date": "2024-01-01",
        "end_date": "2024-01-01"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Should return data for the specified date range
    assert len(data["data"]) > 0

def test_waiting_time_analytics_daily_view(client, sample_camera_events):
    """Test waiting time analytics with daily view"""
    response = client.get("/api/v1/analytics/waiting-time", params={
        "view_type": "daily"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that data is grouped by day
    if data["data"]:
        # All time_periods should be dates (not hours)
        for item in data["data"]:
            assert ":" not in item["time_period"]  # No hours in daily view

def test_waiting_time_analytics_invalid_view_type(client):
    """Test waiting time analytics with invalid view_type"""
    response = client.get("/api/v1/analytics/waiting-time", params={
        "view_type": "invalid"
    })
    
    assert response.status_code == 400
    assert "Invalid view_type" in response.json()["detail"]

def test_waiting_time_analytics_invalid_date_format(client):
    """Test waiting time analytics with invalid date format"""
    response = client.get("/api/v1/analytics/waiting-time", params={
        "start_date": "invalid-date"
    })
    
    assert response.status_code == 400
    assert "Invalid start_date format" in response.json()["detail"]

def test_waiting_time_analytics_camera_filter(client, sample_camera_events):
    """Test waiting time analytics with camera filtering"""
    response = client.get("/api/v1/analytics/waiting-time", params={
        "camera_ids": "camera_0"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Should only include data for camera_0
    if data["data"]:
        for item in data["data"]:
            assert "camera_0" in item["camera_info"]["camera_description"]

def test_waiting_time_analytics_response_structure(client, sample_camera_events):
    """Test that response structure matches API specification"""
    response = client.get("/api/v1/analytics/waiting-time")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check data structure
    if data["data"]:
        item = data["data"][0]
        assert "time_period" in item
        assert "waiting_count" in item
        assert "camera_info" in item
        assert "camera_description" in item["camera_info"]
        assert "camera_group" in item["camera_info"]
    
    # Check metadata structure
    metadata = data["metadata"]
    assert "total_records" in metadata
    assert "filtered_records" in metadata
    assert "time_range" in metadata
    assert "parameters" in metadata 