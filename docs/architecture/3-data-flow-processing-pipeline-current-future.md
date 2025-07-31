# 3. Data Flow & Processing Pipeline (Current & Future)

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
   - **Lightweight (small file):** Pandas processes the file synchronously—calculates dwell time, extracts demographic data, aggregates by session/person/camera/demographics.
   - **Heavy (large file):** File is queued to Celery (via Redis). Worker processes data asynchronously.
   - **Demographic Processing:** Extracts `age_group_outcome` and `gender_outcome`, maps null/undefined to "other".
   - **Timestamp Processing:** Converts `utc_time_started_readable` and `utc_time_ended_readable` from VARCHAR to timestamp format.
   - **Dwell Time Calculation:** Calculates dwell time using `utc_time_ended_readable - utc_time_started_readable` formula with proper timestamp arithmetic.
   - **Insight Merging:** If a JSON “Insight Report” is provided, its events are time-synced with CSV-derived occupancy, enabling cross-source analytics (e.g., peak crowd, correlation).
4. **Storage:** Results (sessions, aggregates, crowd events, demographic data) and file metadata are saved to PostgreSQL.
5. **Analytics Fetch:** React frontend calls API endpoints to fetch cards, tables, charts, and advanced stats with demographic filtering.
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
