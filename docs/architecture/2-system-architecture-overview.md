# 2. System Architecture Overview

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
