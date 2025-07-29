# EPIC: End-to-End Dwell Time Analytics from Camera Data

---

## Description
As a facility/security/operations team, I want to be able to upload camera event data (CSV), process it, and view interactive dashboards and reports showing visitor dwell times, occupancy, repeat visitors, and crowding risks—so that I can optimize our space usage, spot problems early, and improve operational decisions.

---

## Goals / Value
- Enable data-driven space and crowd management.
- Replace slow, manual analysis with automated dashboards.
- Make actionable metrics accessible to non-technical staff.

---

## Acceptance Criteria
- Users can upload valid camera event files (CSV) through the UI.
- The system processes the file and calculates dwell time, unique visitors, repeat visits, and occupancy.
- An interactive dashboard displays summary metrics (KPI cards), dwell histograms, and occupancy charts.
- Users can filter, sort, and export detailed event/session tables.
- Upload errors, invalid files, or missing data are clearly communicated to the user.
- All analytics are available within 2 minutes of file upload for typical files (<10,000 events).
- Data is securely handled and only available to authenticated users.

---

## Notes / Constraints
- MVP: Focus on file upload, not API ingest (API comes in a later epic).
- Support for optional demographic fields (age, gender) if present in CSV.
- Crowd/loitering (JSON) and real-time support will be tracked in separate epics.
- Mobile/tablet dashboard access is a “nice to have” but not required for launch.

