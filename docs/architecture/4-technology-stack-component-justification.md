# 4. Technology Stack & Component Justification

**Frontend:**

- **React + Vite + TypeScript:**\
  Modern, fast developer workflow, scalable for complex UI. Broad ecosystem for UI kits and charting (Recharts, ECharts).
- **Tailwind CSS:**\
  Utility-first CSS framework for rapid UI development, consistent design system, and responsive design. Provides pre-built components and design tokens for modern, beautiful interfaces.
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
