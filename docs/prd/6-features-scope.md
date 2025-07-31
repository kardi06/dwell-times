# 6. Features & Scope

## MVP (v0.1)
- **CSV/JSON Upload:**  
  - Drag-and-drop UI for camera event and crowd/loitering data.
  - File schema and size validation.
- **Core Analytics Dashboard:**  
  - KPI cards: total visitors, dwell time (avg/max), number of unique persons, total events, etc.
  - Table: per-session event list with filtering, sorting, and CSV export.
- **Basic Charts:**  
  - Dwell time histogram.
  - Occupancy over time (line/area chart).
- **Data Aggregation:**  
  - Group by person, camera, time, demographic attributes (age group, gender).
- **Demographic Analytics:**  
  - Age group and gender-based dwell time analysis.
  - Filtering by demographic attributes with null handling ("other" category).
- **Basic User Auth:**  
  - JWT or equivalent for secure access.

---

## Phase 2 (v0.2)
- **Advanced Dashboard & Filters:**  
  - Interactive filters by camera, date, demographic, dwell duration.
  - Camera-wise and time-wise heatmaps.
  - Enhanced demographic filtering with dropdown selects.
- **Repeat Visitor Analysis:**  
  - Identify and display top repeat visitors.
- **Peak Hour Detection:**  
  - Peak hour widget, hourly crowd charts.
  - Time-based grouping with hourly intervals.
- **Insight Report Merge:**  
  - Join loitering/crowd events (JSON) with occupancy analytics.
- **Enhanced Demographic Analytics:**  
  - Time-period based demographic analysis (hourly grouping).
  - Demographic distribution charts and heatmaps.

---

## Phase 3 (v0.3+)
- **Multi-User & Project Workspace:**  
  - User management, file/project history, team access.
- **Real-Time Event Ingest (API):**  
  - Automated data fetch from Corsight API (scheduled pull, or webhook/event-driven if supported).
  - Live occupancy and crowd event updates via WebSocket.
- **Alerting:**  
  - Real-time alerts for crowding, loitering, or occupancy spikes.
- **Integration:**  
  - Export/forward analytics to BI tools (Metabase, Power BI).
  - API endpoints for downstream system consumption.

---

## Future / Nice-to-Have
- **Zone Mapping:**  
  Support for zones within a single camera’s field of view.
- **Anomaly Detection:**  
  Highlight dwell/crowd outliers, unexpected patterns.
- **Advanced Demographic Analytics:**  
  Machine learning-based demographic insights and predictions.
  - Behavioral pattern analysis by demographics.
  - Predictive analytics for demographic trends.
- **Edge Compute:**  
  Option to run pipeline on NVR/Jetson devices for low-latency use cases.

---
