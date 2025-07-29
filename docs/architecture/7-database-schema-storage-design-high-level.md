# 7. Database Schema & Storage Design (High Level)

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
