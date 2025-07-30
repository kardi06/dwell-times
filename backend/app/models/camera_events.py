from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Index, BigInteger, Float
from sqlalchemy.sql import func
from ..core.database import Base

class CameraEvent(Base):
    __tablename__ = "camera_events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Core fields from your CSV
    person_id = Column(String(100), nullable=False, index=True)
    retain = Column(Boolean, nullable=True)
    appearance_labeled_ou_event = Column(String(50), nullable=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_id = Column(String(100), nullable=True, index=True)
    
    # Timestamp fields from your CSV
    utc_time_recorded = Column(BigInteger, nullable=True)  # Unix timestamp
    utc_time_recorded_readable = Column(String(100), nullable=True)
    appearance_utc_time_s = Column(BigInteger, nullable=True)
    utc_time_s = Column(BigInteger, nullable=True)
    utc_time_e = Column(BigInteger, nullable=True)
    utc_time_e_first_frame_last = Column(BigInteger, nullable=True)
    
    # Frame information
    first_frame = Column(Integer, nullable=True)
    last_frame_attributes = Column(String(100), nullable=True)
    
    # Camera information
    camera_id = Column(String(100), nullable=False, index=True)
    camera_de_node_id = Column(String(100), nullable=True)
    
    # Analysis fields
    analysis_m_record_face = Column(Boolean, nullable=True)
    matching_camera = Column(Boolean, nullable=True)
    camera_grc = Column(String(100), nullable=True)
    camera_grc_zone_name = Column(String(100), nullable=True)
    
    # Zone information
    zone_id = Column(String(100), nullable=True)
    zone_verific_face_score = Column(Float, nullable=True)
    
    # Frame details
    frame_id = Column(Integer, nullable=True)
    frame_time = Column(BigInteger, nullable=True)
    
    # Bounding box coordinates
    bbox_x1 = Column(Integer, nullable=True)
    bbox_y1 = Column(Integer, nullable=True)
    bbox_x2 = Column(Integer, nullable=True)
    bbox_y2 = Column(Integer, nullable=True)
    
    # Watchlist information
    watchlist_ty = Column(String(50), nullable=True)
    watchlist_d = Column(String(100), nullable=True)
    watchlist_g_match = Column(String(50), nullable=True)
    
    # Demographics
    out_age_group = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    out_liveness = Column(String(50), nullable=True)
    
    # Calculated fields for dwell time analysis
    session_id = Column(String(100), nullable=True, index=True)
    dwell_duration = Column(Integer, nullable=True)  # Duration in seconds (legacy)
    dwell_time = Column(Integer, nullable=True, index=True)  # Pre-calculated dwell time in seconds
    is_entry = Column(Boolean, nullable=True, index=True)
    is_exit = Column(Boolean, nullable=True, index=True)
    
    # Camera description for analytics
    camera_description = Column(String(100), nullable=True, index=True)
    zone_name = Column(String(100), nullable=True, index=True)
    
    # Processed timestamp for analytics
    processed_timestamp = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Raw data storage for debugging
    raw_data = Column(Text, nullable=True)
    
    # Composite indexes for performance - optimized for GROUP BY queries
    __table_args__ = (
        Index('idx_person_camera_timestamp', 'person_id', 'camera_id', 'processed_timestamp'),
        Index('idx_session_timestamp', 'session_id', 'processed_timestamp'),
        Index('idx_event_type', 'event_type'),
        Index('idx_frame_time', 'frame_time'),
        Index('idx_person_camera_description', 'person_id', 'camera_description'),
        Index('idx_dwell_time_analytics', 'person_id', 'camera_description', 'dwell_time'),
        Index('idx_created_at_analytics', 'created_at'),
        Index('idx_camera_description_filter', 'camera_description'),
        Index('idx_zone_name_filter', 'zone_name'),
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