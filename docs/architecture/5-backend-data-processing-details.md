# 5. Backend & Data Processing Details

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
