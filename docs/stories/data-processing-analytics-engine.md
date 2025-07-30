# Data Processing & Analytics Engine

**Story ID:** DATA-001  
**Created:** 2025-01-27  
**Story Points:** 8 (Medium - complex data processing)  
**Priority:** High (Core functionality for MVP)

---

## **User Story**

**As a** security operations manager  
**I want to** upload camera event data and have it automatically processed into meaningful analytics  
**So that** I can get immediate insights about dwell time, occupancy patterns, and visitor behavior without manual data analysis

---

## **Acceptance Criteria**

### 1. CSV Data Ingestion & Validation
- [x] Parse CSV files with camera event data
- [x] Validate required columns: timestamp, person_id, camera_id, event_type
- [x] Handle various timestamp formats (ISO, Unix, custom formats)
- [x] Detect and report data quality issues (missing values, invalid formats)
- [x] Support file sizes up to 100MB with progress tracking
- [x] Store raw data in PostgreSQL with proper indexing

### 2. Dwell Time Calculation Engine
- [x] Calculate dwell time for each person (time between entry and exit events)
- [x] Handle multiple entry/exit events per person per session
- [x] Aggregate dwell times by person, camera, and time periods
- [x] Calculate average, median, and maximum dwell times
- [x] Handle edge cases (incomplete sessions, data gaps)
- [x] Store calculated dwell time data in optimized format

### 3. Analytics Computation Service
- [x] Real-time calculation of KPI metrics:
  - Total unique visitors
  - Average dwell time per person
  - Maximum dwell time observed
  - Total events processed
  - Number of cameras with activity
- [x] Generate occupancy analytics (visitors per time period)
- [x] Calculate repeat visitor statistics
- [x] Create time-based aggregations (hourly, daily, weekly)
- [x] Cache analytics results for performance

### 4. Data Aggregation & Grouping
- [x] Group analytics by person, camera, time periods
- [x] Support demographic attributes if present in data
- [x] Create summary statistics for each grouping
- [x] Generate data for chart visualizations
- [x] Optimize queries for large datasets

### 5. API Endpoints for Analytics
- [x] REST API endpoints for retrieving analytics data
- [x] Support for filtering by date range, camera, person
- [x] Pagination for large result sets
- [x] JSON response format for frontend consumption
- [x] API documentation with Swagger/OpenAPI

### 6. Error Handling & Data Quality
- [x] Comprehensive error handling for malformed data
- [x] Data validation and cleaning procedures
- [x] Logging of processing errors and warnings
- [x] User-friendly error messages for invalid data
- [x] Data quality metrics and reporting

---

## **Technical Requirements**

### Data Processing Pipeline
- **CSV Parser:** Pandas with custom validation
- **Dwell Time Engine:** Custom Python algorithms
- **Analytics Engine:** Pandas/Numpy for calculations
- **Database:** PostgreSQL with optimized schemas
- **Caching:** Redis for analytics results
- **API:** FastAPI with async processing

### Database Schema Extensions
```sql
-- Extended camera events table with calculated fields
ALTER TABLE camera_events ADD COLUMN session_id VARCHAR(100);
ALTER TABLE camera_events ADD COLUMN dwell_duration INTEGER;
ALTER TABLE camera_events ADD COLUMN is_entry BOOLEAN;
ALTER TABLE camera_events ADD COLUMN is_exit BOOLEAN;

-- Analytics cache table for performance
CREATE TABLE analytics_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    metric_data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Person sessions table for dwell time tracking
CREATE TABLE person_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    person_id VARCHAR(100) NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    dwell_duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Processing Algorithms
- **Dwell Time Calculation:**
  - Match entry/exit events by person_id and camera_id
  - Calculate time difference for complete sessions
  - Handle overlapping sessions and data gaps
  - Aggregate by time periods and cameras

- **Analytics Computation:**
  - Real-time metric calculation on data upload
  - Caching strategy for frequently accessed metrics
  - Batch processing for large datasets
  - Incremental updates for new data

### Performance Requirements
- Process 10,000+ events in under 30 seconds
- Support concurrent uploads and processing
- Cache analytics results for 1 hour
- Database queries optimized for large datasets
- Memory-efficient processing for large files

---

## **Definition of Done**

- [ ] CSV files are parsed and validated successfully
- [ ] Dwell time calculations are accurate and handle edge cases
- [ ] Analytics metrics are computed in real-time
- [ ] API endpoints return correct data with proper filtering
- [ ] Error handling covers all common data quality issues
- [ ] Performance meets requirements for large datasets
- [ ] Database schema is optimized for analytics queries
- [ ] Caching system improves response times
- [ ] Comprehensive logging and monitoring is in place
- [ ] Unit tests cover core processing algorithms
- [ ] API documentation is complete and accurate

---

## **Dependencies**

- SETUP-001 (Project Setup & Development Environment)
- Database schema design and implementation
- Basic API framework setup
- Authentication system foundation

---

## **Notes**

This story implements the core data processing engine that powers all analytics features. It's critical for the MVP as it transforms raw camera data into actionable insights.

**Key Success Metrics:**
- Data processing accuracy > 99%
- Processing time < 30 seconds for 10,000 events
- API response time < 2 seconds for analytics queries
- Error rate < 1% for valid data files

**Future Considerations:**
- Engine should support JSON crowd/loitering data in Phase 2
- Real-time processing capabilities for live data feeds
- Machine learning integration for anomaly detection
- Support for multiple data sources and formats

---

## **Story Breakdown (Optional)**

If this story needs to be broken down further:

1. **CSV Ingestion & Validation** (2 points)
2. **Dwell Time Calculation Engine** (3 points)
3. **Analytics Computation Service** (2 points)
4. **API Endpoints & Caching** (1 point)

---

**Status:** Approved  
**Assigned To:** TBD  
**Sprint:** MVP Sprint 1

---

## **Dev Agent Record**

### **Agent Model Used**
- **Agent:** James (Full Stack Developer)
- **Role:** Expert Senior Software Engineer & Implementation Specialist
- **Focus:** Executing story tasks with precision, comprehensive testing, and performance optimization

### **Debug Log References**
- **CSV Processing:** Implemented chunked processing for large files (100MB+ support)
- **Dwell Time Engine:** Optimized session matching algorithm for entry/exit pairs
- **Analytics Service:** Added caching layer with 1-hour expiration for performance
- **Database Schema:** Created optimized indexes for analytics queries
- **Error Handling:** Comprehensive validation and user-friendly error messages

### **Completion Notes List**
- ✅ **Task 1:** CSV Data Ingestion & Validation - Complete with multi-format timestamp support
- ✅ **Task 2:** Dwell Time Calculation Engine - Complete with session tracking and edge case handling
- ✅ **Task 3:** Analytics Computation Service - Complete with real-time KPI metrics and caching
- ✅ **Task 4:** Data Aggregation & Grouping - Complete with flexible grouping options
- ✅ **Task 5:** API Endpoints for Analytics - Complete with comprehensive REST API
- ✅ **Task 6:** Error Handling & Data Quality - Complete with validation and logging

### **File List**
**New Files Created:**
- `backend/app/models/camera_events.py` - Database models for camera events, sessions, and analytics cache
- `backend/app/services/csv_processor.py` - CSV processing service with validation and chunked processing
- `backend/app/services/dwell_time_engine.py` - Dwell time calculation engine with session tracking
- `backend/app/services/analytics_service.py` - Analytics computation service with KPI metrics and caching
- `backend/app/api/analytics.py` - REST API endpoints for analytics data
- `backend/tests/test_data_processing.py` - Comprehensive test suite for data processing functionality
- `backend/test_data/sample_camera_events.csv` - Sample test data for validation

**Modified Files:**
- `backend/app/main.py` - Added analytics router integration
- `backend/app/core/exceptions.py` - Added custom exception classes for data processing
- `docs/stories/data-processing-analytics-engine.md` - Updated task completion status

### **Change Log**
**2025-01-27:**
- Implemented complete data processing pipeline
- Created database models with optimized indexes
- Built CSV processor with multi-format timestamp support
- Developed dwell time calculation engine with session tracking
- Implemented analytics service with real-time KPI metrics
- Created comprehensive REST API with filtering and pagination
- Added comprehensive error handling and validation
- Created test suite and sample data for validation
- Updated story file with completion status

### **Performance Optimizations**
- **Database Indexes:** Added composite indexes for person_id, camera_id, timestamp queries
- **Chunked Processing:** Implemented 1000-row chunks for large CSV files
- **Caching:** Added 1-hour cache for analytics results
- **Bulk Operations:** Used bulk_save_objects for efficient database inserts
- **Query Optimization:** Optimized analytics queries with proper joins and aggregations 