# 7. Database Schema & Storage Design (High Level)

**Core Tables:**

- **camera\_events** (Primary table for camera event data)

  - `id` (PK, integer, auto-increment)
  - `timestamp` (timestamp with time zone)
  - `person_id` (VARCHAR(100), NOT NULL)
  - `camera_id` (VARCHAR(100), NOT NULL)
  - `event_type` (VARCHAR(50), NOT NULL)
  - `session_id` (VARCHAR(100))
  - `dwell_duration` (integer)
  - `is_entry` (boolean)
  - `is_exit` (boolean)
  - `created_at` (timestamp with time zone, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` (timestamp with time zone, DEFAULT CURRENT_TIMESTAMP)
  - `raw_data` (text)
  - `retain` (boolean)
  - `appearance_labeled_ou_event` (VARCHAR(50))
  - `event_id` (VARCHAR(100))
  - `utc_time_recorded` (bigint)
  - `utc_time_recorded_readable` (VARCHAR(100))
  - `appearance_utc_time_s` (bigint)
  - `utc_time_s` (bigint)
  - `utc_time_e` (bigint)
  - `utc_time_e_first_frame_last` (bigint)
  - `first_frame` (integer)
  - `last_frame_attributes` (VARCHAR(100))
  - `camera_de_node_id` (VARCHAR(100))
  - `analysis_m_record_face` (boolean)
  - `matching_camera` (boolean)
  - `camera_grc` (VARCHAR(100))
  - `camera_grc_zone_name` (VARCHAR(100))
  - `zone_id` (VARCHAR(100))
  - `zone_verific_face_score` (double precision)
  - `frame_id` (integer)
  - `frame_time` (bigint)
  - `bbox_x1`, `bbox_y1`, `bbox_x2`, `bbox_y2` (integer)
  - `watchlist_ty` (VARCHAR(50))
  - `watchlist_d` (VARCHAR(100))
  - `watchlist_g_match` (VARCHAR(50))
  - `out_age_group` (VARCHAR(50))
  - `gender` (VARCHAR(20))
  - `out_liveness` (VARCHAR(50))
  - `processed_timestamp` (timestamp with time zone)
  - `dwell_time` (integer, calculated dwell time)
  - `camera_description` (VARCHAR(100))
  - `zone_name` (VARCHAR(100), nullable)
  - **NEW:** `age_group_outcome` (VARCHAR(50), nullable)
  - **NEW:** `gender_outcome` (VARCHAR(20), nullable)

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

- Primary key index on `id`
- Indexes on `person_id`, `camera_id`, `created_at` for fast filtering and aggregation
- **NEW:** Indexes on `age_group_outcome`, `gender_outcome` for demographic filtering
- **NEW:** Composite index on `person_id`, `age_group_outcome`, `gender_outcome`, `created_at` for demographic grouping queries
- Indexes on `dwell_time`, `camera_description`, `zone_name` for analytics queries

**Storage:**

- Raw files (CSV/JSON) can be stored on disk or in cloud storage, with only metadata in DB.
- For future: partition large tables by date or camera for scalability.
- **Demographic Data Handling:** Null/undefined values in `age_group_outcome` and `gender_outcome` are mapped to "other" during processing.
- **Dwell Time Calculation:** Pre-calculated during CSV upload using `utc_time_ended_readable - utc_time_started_readable` formula.

---
