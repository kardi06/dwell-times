from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Index
from sqlalchemy.sql import func
from ..core.database import Base

class CameraEvent(Base):
    __tablename__ = "camera_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    person_id = Column(String(100), nullable=False, index=True)
    camera_id = Column(String(50), nullable=False, index=True)
    event_type = Column(String(20), nullable=False, index=True)  # 'entry', 'exit', etc.
    
    # Calculated fields for dwell time analysis
    session_id = Column(String(100), nullable=True, index=True)
    dwell_duration = Column(Integer, nullable=True)  # Duration in seconds
    is_entry = Column(Boolean, nullable=True, index=True)
    is_exit = Column(Boolean, nullable=True, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Raw data storage for debugging
    raw_data = Column(Text, nullable=True)
    
    # Composite indexes for performance
    __table_args__ = (
        Index('idx_person_camera_timestamp', 'person_id', 'camera_id', 'timestamp'),
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
    )

class PersonSession(Base):
    __tablename__ = "person_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    person_id = Column(String(100), nullable=False, index=True)
    camera_id = Column(String(50), nullable=False, index=True)
    entry_time = Column(DateTime(timezone=True), nullable=False)
    exit_time = Column(DateTime(timezone=True), nullable=True)
    dwell_duration = Column(Integer, nullable=True)  # Duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Composite indexes for performance
    __table_args__ = (
        Index('idx_person_camera_session', 'person_id', 'camera_id', 'session_id'),
        Index('idx_entry_time', 'entry_time'),
    )

class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, nullable=False, index=True)
    metric_data = Column(Text, nullable=False)  # JSONB equivalent for SQLite compatibility
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True) 