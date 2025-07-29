# 10. Risks & Dependencies

## Key Risks
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

## Dependencies
- **Corsight Data/API:**  
  For long-term automation, reliable access to Corsight’s event API and documentation is critical.
- **Cloud/Infra:**  
  Scalable, secure hosting for backend, DB, file storage, and WebSocket services.
- **Charting/UI Libraries:**  
  Continued support for React, Recharts/ECharts, Material UI/Chakra UI, etc.
- **Team Skills:**  
  Continued access to Python (FastAPI, Pandas), React, and devops expertise.

## Mitigation Strategies
- Rigorous file validation and user feedback for uploads.
- Decoupled data ingest layer to isolate from vendor API changes.
- Profiling and scaling plan for backend jobs and DB as user base grows.
- Regular security audits and privacy reviews.
- Usability testing and continuous improvement of onboarding and UI.

---
