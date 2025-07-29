# Dwell-Insight — Product Requirements Document (PRD)

---

## 1. Product Summary & Vision

**Product Name:**  
Dwell-Insight

**Summary:**  
Dwell-Insight is a web-based analytics dashboard for processing and visualizing data from security cameras and crowd-detection sensors. It enables facility managers, security teams, and operational leaders to make data-driven decisions based on dwell time, occupancy, visitor patterns, and crowd events—derived from CSV and JSON outputs or directly integrated with Corsight APIs.

**Vision:**  
To become the most user-friendly, extensible, and actionable platform for real-world analytics from camera and crowd data, empowering organizations to optimize space, manage risk, and unlock the full potential of their physical environments with minimal manual effort.

**Core Product Values:**
- **Speed to insight:** From upload to actionable dashboard in minutes.
- **Trust:** Transparent, accurate, and reliable analytics.
- **Extensibility:** Designed to adapt to evolving needs (data sources, metrics, workflows).
- **Security & Privacy:** All data handled safely, user and org access tightly controlled.

---

## 2. Background / Context

**Background:**  
Organizations with physical spaces—such as office buildings, malls, transit hubs, and campuses—often lack real-time, data-driven visibility into how those spaces are used. While many deploy camera-based systems, the raw data is difficult to analyze without specialized tools. Existing solutions are either too basic (manual review) or too complex/expensive (legacy video analytics platforms).

**Context:**
- Advances in camera AI (e.g., Corsight) make it easy to export structured event logs (CSV, JSON) detailing every appearance, movement, and crowd event.
- Facility and security teams want actionable analytics:  
  - How long do people linger (“dwell time”)?
  - Where and when are crowding risks highest?
  - Who are the repeat visitors, and what are the patterns?
  - Can we detect anomalies or improve crowd flow?
- Current workflows are manual, siloed, and slow.
- There is a need for a self-service analytics platform that works out-of-the-box with camera event files **today**, and can integrate directly with APIs **tomorrow**.

**Strategic Fit:**  
Dwell-Insight meets immediate operational needs (manual upload, dashboard) and lays a foundation for long-term automation, integration, and smarter real-time response.

---

## 3. Stakeholders & Users

### Primary Stakeholders
- **Facility Managers:** Oversee building operations, optimize crowd flow, improve visitor experience.
- **Security Teams:** Monitor for loitering, crowding, repeat visitors, and potential security incidents.
- **Operations Leaders:** Use occupancy and crowd data for resource planning, scheduling, and efficiency.
- **IT/Systems Admins:** Integrate the platform, manage user accounts, and ensure data security.

### End Users
- **Dashboard Users:**  
  - Typically non-technical staff responsible for real-time monitoring, reporting, or compliance.
  - Need clear, actionable insights and easy data export.
- **Data Analysts (optional/advanced):**  
  - May export raw/session data for further analysis or BI tool integration.
- **Executives (View-Only):**  
  - Want at-a-glance summaries, trends, and high-level KPIs for reporting.

### Future Users (Roadmap)
- **Multi-site Org Admins:**  
  - Manage multiple locations and need consolidated analytics.
- **Integration Partners:**  
  - Connect Dwell-Insight to other facility systems (e.g., BMS, HR, ticketing, alerting).

---

## 4. Problem Statement / Opportunity

### Problem Statement
Organizations struggle to extract actionable insights from camera event and crowd data due to:
- Manual, time-consuming processes for uploading and analyzing data (CSV, JSON, etc.).
- Lack of unified, user-friendly dashboards for viewing dwell time, occupancy, and crowding analytics.
- Inability to quickly identify repeat visitors, peak times, or crowding risks without data engineering help.
- No clear pathway from file uploads today to automated, API-driven analytics tomorrow.

### Opportunity
By providing an out-of-the-box analytics platform that supports both manual uploads and future API integration, Dwell-Insight can:
- Dramatically reduce time-to-insight for facility and security teams.
- Increase situational awareness and operational responsiveness (e.g., opening more gates when crowds build).
- Democratize access to camera and crowd analytics, making it available to non-technical users.
- Serve as a foundation for future automation, alerting, and integration with organizational workflows.

---

## 5. Objectives & Success Metrics

### Objectives
- **Rapid Insight:**  
  Enable users to go from camera event file (CSV/JSON) upload to actionable analytics within minutes.
- **Usability:**  
  Ensure the dashboard is intuitive for non-technical users—minimal training required.
- **Flexibility:**  
  Support both file-based and direct API data ingestion.
- **Scalability:**  
  Lay groundwork for multi-user, multi-site, and real-time analytics.
- **Accuracy:**  
  Provide reliable, trustworthy metrics and clear audit trails for all calculations.

### Success Metrics
- **Time to Insight:**  
  Median time from file upload/API ingest to dashboard availability is < 2 minutes.
- **User Engagement:**  
  >75% of active users use dashboard cards, filters, and export at least weekly.
- **Adoption:**  
  Platform is adopted by at least 3 operational teams within 6 months.
- **Data Quality:**  
  <2% upload error rate due to data validation or schema issues.
- **Feature Uptake:**  
  At least 60% of users leverage advanced analytics (repeat visitor, peak hours, crowd alerts) by v0.3.
- **Scalability:**  
  Able to handle 1 million+ events with no degradation in dashboard performance.

---

## 6. Features & Scope

### MVP (v0.1)
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
  - Group by person, camera, time, demographic attributes.
- **Basic User Auth:**  
  - JWT or equivalent for secure access.

---

### Phase 2 (v0.2)
- **Advanced Dashboard & Filters:**  
  - Interactive filters by camera, date, demographic, dwell duration.
  - Camera-wise and time-wise heatmaps.
- **Repeat Visitor Analysis:**  
  - Identify and display top repeat visitors.
- **Peak Hour Detection:**  
  - Peak hour widget, hourly crowd charts.
- **Insight Report Merge:**  
  - Join loitering/crowd events (JSON) with occupancy analytics.

---

### Phase 3 (v0.3+)
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

### Future / Nice-to-Have
- **Zone Mapping:**  
  Support for zones within a single camera’s field of view.
- **Anomaly Detection:**  
  Highlight dwell/crowd outliers, unexpected patterns.
- **Demographic Analytics:**  
  Pie-charts or heatmaps by age/gender if data is present.
- **Edge Compute:**  
  Option to run pipeline on NVR/Jetson devices for low-latency use cases.

---

## 7. User Stories / Flows

### MVP User Stories

- **As a user, I want to upload a CSV or JSON file**, so I can analyze camera and crowd data without manual parsing.
- **As a user, I want to see a dashboard of key metrics** (total visitors, dwell time, events) as soon as my data is uploaded and processed.
- **As a user, I want to view and filter a detailed table of events and sessions**, so I can investigate individual entries or export for compliance.
- **As a user, I want to sort, filter, and export the event/session table to CSV**, so I can share or archive reports.
- **As a user, I want to log in securely**, so that only authorized staff can access data and dashboards.

---

### Phase 2+ User Stories

- **As a user, I want to filter analytics by camera, date range, or demographics**, so I can drill down to relevant insights.
- **As a user, I want to see charts of occupancy and crowding over time**, so I can spot patterns or anomalies.
- **As a user, I want to identify and analyze repeat visitors** and see their historical dwell patterns.
- **As a user, I want to be alerted when occupancy or dwell time exceeds a threshold**, so I can respond to crowding or loitering incidents in real time.
- **As an admin, I want to manage users, file uploads, and project history**, so teams can collaborate securely and track changes.
- **As an analyst, I want to integrate data with BI tools**, so I can build custom reports beyond the standard dashboard.

---

### Example User Flow: Upload to Dashboard

1. **User logs in.**
2. Navigates to the Upload page, drags a CSV/JSON file, and submits.
3. Receives feedback on upload status; if valid, processing starts.
4. When complete, is redirected to Dashboard showing summary cards and charts.
5. User applies filters (camera/date) or explores the interactive table.
6. Exports a filtered table as CSV or downloads a report.

---

## 8. Non-functional Requirements (NFRs)

### Performance
- System must process and display analytics for typical data uploads (<10,000 rows) in under 2 minutes.
- Dashboard must remain responsive for up to 1 million events.
- Upload and processing status should provide real-time or near-real-time feedback to users.

### Usability
- UI is mobile and tablet friendly.
- 90% of first-time users can upload and see basic analytics without training.
- Error messages are clear and actionable (e.g., file format, validation).

### Reliability & Availability
- 99% uptime during business hours.
- Uploads and analytics must be recoverable after backend or network failures.

### Security
- All data in transit and at rest is encrypted.
- JWT-based authentication with roles (admin, user).
- Strict validation and sanitization of all uploads.

### Compliance
- System logs all data uploads, downloads, and user actions for audit.
- GDPR or local privacy compliance where applicable (PII minimization, deletion on request).

### Extensibility & Maintainability
- Modular architecture to support new data types, sources, analytics, and UI components.
- Automated tests for all critical business logic and endpoints.

---

## 9. Milestones & Roadmap

### v0.1 — MVP
- CSV/JSON upload via UI
- Schema and size validation
- Processing pipeline for dwell/crowd data
- Summary dashboard cards (visitors, dwell time, events)
- Session/event table with sort/filter/export
- Basic charts (dwell histogram, occupancy over time)
- Basic user authentication

**Estimated time:** 4–6 weeks

---

### v0.2 — Full Dashboard & Advanced Analytics
- Interactive filters (camera, date, demographics)
- Camera/time heatmaps and peak hour widgets
- Repeat visitor analysis
- Insight report merge (crowd JSON + dwell CSV)
- Error handling, upload status, and feedback improvements

**Estimated time:** 3–4 weeks

---

### v0.3 — Multi-user Workspace & Real-time
- Multi-user/project management
- Upload and report history
- Real-time event ingest (API/webhook, if supported by Corsight)
- WebSocket-based live dashboard updates
- Basic alerting (occupancy/dwell/crowd)

**Estimated time:** 4–6 weeks

---

### v0.4+ — Integration, Automation, and Advanced Features
- API integration with Corsight (scheduled pull or webhook)
- BI tool integration (Metabase, Power BI)
- Zone mapping, anomaly detection, demographic analytics
- Edge compute deployment (NVR/Jetson support)

**Estimated time:** Ongoing (phase-driven)

---

## 10. Risks & Dependencies

### Key Risks
- **Data Quality:**  
  Uploaded files may be inconsistent, missing fields, or have corrupt/duplicate records, impacting analytics accuracy.
- **Vendor/API Changes:**  
  Future Corsight API updates or changes in data format could require major rework of the ingest pipeline.
- **Performance Bottlenecks:**  
  Processing large files or merging complex datasets may exceed expected compute or memory capacity, leading to slow user experience.
- **Security & Compliance:**  
  Improper data handling or access control could expose sensitive information or violate privacy regulations.
- **Adoption:**  
  Non-technical users may find upload or dashboard features confusing if UX is not prioritized.

### Dependencies
- **Corsight Data/API:**  
  For long-term automation, reliable access to Corsight’s event API and documentation is critical.
- **Cloud/Infra:**  
  Scalable, secure hosting for backend, DB, file storage, and WebSocket services.
- **Charting/UI Libraries:**  
  Continued support for React, Recharts/ECharts, Material UI/Chakra UI, etc.
- **Team Skills:**  
  Continued access to Python (FastAPI, Pandas), React, and devops expertise.

### Mitigation Strategies
- Rigorous file validation and user feedback for uploads.
- Decoupled data ingest layer to isolate from vendor API changes.
- Profiling and scaling plan for backend jobs and DB as user base grows.
- Regular security audits and privacy reviews.
- Usability testing and continuous improvement of onboarding and UI.

---

# END

