# Dwell-Insight — Fullstack Architecture Document

---

## 1. Overview & Goals

**Dwell-Insight** is a modular analytics platform designed to ingest, analyze, and visualize camera event data (CSV) and crowd loitering events (JSON) for security, operations, and facility management teams.

**Primary objectives:**

- Deliver fast, actionable insights about visitor dwell time, occupancy, and crowding.
- Provide interactive dashboards, charts, and exports for operational decisions.
- Enable rapid onboarding via self-service upload and automated data validation.
- Support extensibility for future features (multi-user, anomaly alerts, integration).

---

## 2. System Architecture Overview

**Dwell-Insight** follows a modular, service-oriented architecture with clear separation between frontend, backend, analytics processing, and persistent storage. The high-level stack is:

- **Frontend:** Vite + React + TypeScript UI, leveraging charting libraries (e.g., Recharts/ECharts) and Material UI or Chakra UI for consistent, responsive design.
- **Backend API:** Python FastAPI provides REST endpoints for file upload, data fetch, and (optionally) real-time updates.
- **Analytics Processing:** Pandas and custom modules for ingesting CSV/JSON, calculating dwell time, occupancy, and aggregations. Celery (with Redis) offloads heavy/async jobs.
- **Database:** PostgreSQL stores both raw event/session data and aggregated analytics for efficient querying.
- **Queue/Broker:** Redis facilitates fast, decoupled background job handling.
- **(Optional):** WebSocket server for real-time UI updates/alerts.

**Key Principles:**

- **Separation of concerns:** Each component has a single, clear responsibility.
- **Extensibility:** Modular design allows for new analytics, data types, and scaling with minimal disruption.
- **Security:** Authentication, validation, and data handling best practices enforced across layers.

---

## 3. Data Flow & Processing Pipeline (Current & Future)

**Current (v0.1):**

- **Manual Upload:**\
  User uploads camera CSV and insight JSON via web UI.
- **Backend:**\
  FastAPI validates and processes uploads as described above.

**Future (v0.4+):**

- **Automated Data Ingest:**\
  Backend will connect directly to Corsight’s API to retrieve camera events and loitering/crowd insights, either on a schedule or in real-time (webhook/Kafka, if supported).
- **Pluggable Data Sources:**\
  Upload and API ingest will use the same processing pipeline, allowing seamless migration and parallel operation (support both manual and API data).

**Typical Flow:**

1. **Upload:** User uploads a CSV (camera events) and/or JSON (crowd/loitering events) via the web UI.
2. **API Handling:** FastAPI receives the file, validates schema/format, and stores the raw upload.
3. **Processing:**
   - **Lightweight (small file):** Pandas processes the file synchronously—calculates dwell time, aggregates by session/person/camera.
   - **Heavy (large file):** File is queued to Celery (via Redis). Worker processes data asynchronously.
   - **Insight Merging:** If a JSON “Insight Report” is provided, its events are time-synced with CSV-derived occupancy, enabling cross-source analytics (e.g., peak crowd, correlation).
4. **Storage:** Results (sessions, aggregates, crowd events) and file metadata are saved to PostgreSQL.
5. **Analytics Fetch:** React frontend calls API endpoints to fetch cards, tables, charts, and advanced stats.
6. **(Optional) Real-Time:** If real-time mode is enabled, backend pushes dwell/crowd alerts via WebSocket to UI.

**Visual Flow (Text Diagram):**

```
User → [React Frontend] → [FastAPI API]
    └──upload──────────────→│
                           ↓
         ┌────────────┬─────────────┐
         │ Inline     │ Async (via  │
         │ Pandas     │ Celery+Redis│
         └────┬───────┴───────┬─────┘
              ▼               ▼
           [PostgreSQL Database]
                   │
                (API)
                   │
              [React UI]
          (Dashboard/Charts)
```

*Optional: [WebSocket Server] for live alerts to UI.*

---

## 4. Technology Stack & Component Justification

**Frontend:**

- **React + Vite + TypeScript:**\
  Modern, fast developer workflow, scalable for complex UI. Broad ecosystem for UI kits (Material UI, Chakra UI), and charting (Recharts, ECharts).
- **Charting/UI Libraries:**\
  Enable rich, interactive data visualization with responsive design and theme support.

**Backend:**

- **Python + FastAPI:**\
  Combines high developer productivity (Python) with modern, high-performance async API framework. Ideal for data ingestion and analytics.
- **Pandas:**\
  Industry-standard for data cleaning, analytics, and ETL—excellent for handling tabular event data and CSVs.
- **Celery + Redis:**\
  Decouples heavy or slow analytics jobs from API, ensuring fast response and horizontal scalability.

**Database:**

- **PostgreSQL:**\
  Mature, reliable, and efficient for both transactional and analytical queries. Supports rich aggregation, indexing, and JSON fields for extensibility.
- **(No Elasticsearch):**\
  Search requirements and scale do not warrant Elasticsearch for MVP. Revisit only if fast, fuzzy, multi-field search or massive scale is required.

**Infrastructure:**

- **Dockerized Components:**\
  Supports local dev, staging, and production parity. Simplifies deployment and scaling.
- **(Future) Cloud Storage:**\
  For larger files or long-term audit retention.

**Pluggable Data Sources:**

- MVP: Manual upload (CSV/JSON)
- Roadmap: API integration with Corsight for automated data ingestion.

---

## 5. Backend & Data Processing Details

**API Endpoints (FastAPI):**

- `/upload`:\
  Accepts CSV/JSON files (with size, schema, and auth validation). Returns upload status and file metadata.
- `/summary`:\
  Returns aggregate metrics (total visitors, avg/max dwell, top repeat visitors, busiest cameras, etc.).
- `/detail`:\
  Fetches paginated session/event lists (supports filtering, sorting, and export).
- `/crowd/hourly`:\
  Returns hourly crowd event counts (for heatmaps/peak hour).
- `/occupancy/timeline`:\
  Provides occupancy trends over time.

**Processing Flow:**

- **Small files:**\
  Parsed synchronously; Pandas computes metrics on the fly, results cached or stored.
- **Large files:**\
  Handed off to Celery workers via Redis; status tracked and results merged asynchronously into PostgreSQL.
- **Insight Report Integration:**\
  If JSON is uploaded (or fetched via API, future), loitering events are normalized, time-aligned, and merged with dwell/occupancy metrics for joint analytics.

**Error Handling & Validation:**

- File type/size checks
- Mandatory columns: `person_id`, `utc_time_started`, `utc_time_ended`
- Data normalization: timezones, timestamps
- Graceful error reporting (frontend receives actionable errors)

**Extensibility Hooks:**

- Processing functions are modular (easy to plug in API fetch, new data schemas, or analytics jobs).
- Future analytics (zone mapping, anomaly detection) can be added as background tasks.

---

## 6. Frontend & User Interface Overview

**Core Modules:**

- **Upload & Validation:**\
  Drag-and-drop CSV/JSON uploader with immediate schema and size validation. Shows clear error or success feedback.
- **Dashboard Cards:**\
  At-a-glance KPIs (total visitors, events, avg/max dwell time, top repeat visitors, peak hours, cameras with most activity).
- **Interactive Charts:**
  - **Histogram:** Dwell time distribution
  - **Line/Area:** Occupancy over time
  - **Heatmap/Bar:** Crowd events per camera and hour
- **Session/Event Table:**\
  Fully interactive: filter, sort, paginate, and export to CSV. Displays all raw and derived data fields.
- **Filters & Search:**\
  By camera, date/time range, demographic attributes, dwell duration.
- **Alert/Notification UI:**\
  (Future) Displays real-time alerts for anomalous dwell/crowd events (WebSocket-driven).

**User Experience (UX) Principles:**

- **Clarity:**\
  Clean, intuitive layout with contextual tooltips and onboarding guides.
- **Responsiveness:**\
  Mobile/tablet-friendly, instant feedback on all user actions.
- **Performance:**\
  Asynchronous data loading with progress indicators for heavy queries/exports.
- **Accessibility:**\
  Supports keyboard navigation and screen readers.

**Extensibility:**

- UI components are modular and themable, supporting new dashboard cards, charts, or filters without redesign.
- Ready for future features: multi-user workspace, project history, advanced analytics, and integration widgets.

---

## 7. Database Schema & Storage Design (High Level)

**Core Tables:**

- **session\_events**

  - `id` (PK)
  - `person_id`
  - `event_id`
  - `camera_id`
  - `camera_description`
  - `camera_group_id`
  - `camera_group_name`
  - `utc_time_started`
  - `utc_time_ended`
  - `dwell_sec`
  - Demographic columns: `age_group_outcome`, `gender_outcome`, `appearance_category`, ...
  - `raw_payload` (optional JSON column for extra/unmapped fields)

- **crowd\_events**

  - `id` (PK)
  - `event_id`
  - `person_id`
  - `camera_id`
  - `utc_time_recorded`
  - `save_insight_time`
  - `loitering_duration`
  - Demographics: `gender`, `age_group`
  - `raw_json` (full original event)

- **aggregates**

  - `id` (PK)
  - `person_id`/`camera_id`/`hour`/etc. (multi-indexable)
  - `total_dwell_time`
  - `avg_dwell_time`
  - `visit_count`
  - `repeat_visitor` (bool/count)
  - Any calculated summary stats

- **file\_uploads**

  - `id` (PK)
  - `filename`
  - `upload_time`
  - `uploader`
  - `status` (pending, processed, failed)
  - `notes` (error/debug info)

- **users** (optional, if multi-user workspace needed)

  - `id` (PK)
  - `username`
  - `password_hash`
  - `role` (admin/viewer/etc.)
  - `created_at`

**Indexes:**

- Primary and foreign key indexes for `person_id`, `camera_id`, time fields for fast filtering and aggregation.

**Storage:**

- Raw files (CSV/JSON) can be stored on disk or in cloud storage, with only metadata in DB.
- For future: partition large tables by date or camera for scalability.

---

## 8. Scalability, Extensibility, and Security

**Scalability:**

- **Batch/Async Processing:**\
  Celery offloads heavy jobs; Redis queue enables parallel processing. Horizontal scaling possible by adding more workers.
- **Efficient Aggregation:**\
  Use DB indexes and pre-aggregated tables for fast dashboard queries.
- **Partitioning:**\
  Future: Partition raw event/crowd tables by date or camera to keep queries fast at scale.
- **Containerization:**\
  Docker makes it easy to scale up (multiple API/backend/worker instances) for load balancing.

**Extensibility:**

- **Pluggable Data Sources:**\
  Data ingest can be switched from manual upload to direct API fetch (Corsight) with minimal disruption.
- **Modular Analytics:**\
  Processing pipeline can add new metrics (zone mapping, anomaly detection, custom watchlists) as separate modules/jobs.
- **UI Extensibility:**\
  Dashboard supports new cards, filters, or charts with no full rewrite. Backend can expose new endpoints as needed.
- **Future Features:**\
  Workspace/multi-user support, advanced alerting/notifications, API/webhook for integration with BI tools.

**Security:**

- **Authentication & Authorization:**\
  JWT-based login, user roles (admin, viewer, etc.), access control on sensitive endpoints.
- **File Validation:**\
  Strict schema checking, sanitization, and size limits to block malicious input.
- **Transport Security:**\
  Enforce HTTPS everywhere, CORS policy for API.
- **Operational Security:**\
  Logging, monitoring, and audit trails for uploads/edits.\
  Prepared for GDPR/data retention features if required.

---

# END

