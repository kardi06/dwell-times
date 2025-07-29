# 8. Non-functional Requirements (NFRs)

## Performance
- System must process and display analytics for typical data uploads (<10,000 rows) in under 2 minutes.
- Dashboard must remain responsive for up to 1 million events.
- Upload and processing status should provide real-time or near-real-time feedback to users.

## Usability
- UI is mobile and tablet friendly.
- 90% of first-time users can upload and see basic analytics without training.
- Error messages are clear and actionable (e.g., file format, validation).

## Reliability & Availability
- 99% uptime during business hours.
- Uploads and analytics must be recoverable after backend or network failures.

## Security
- All data in transit and at rest is encrypted.
- JWT-based authentication with roles (admin, user).
- Strict validation and sanitization of all uploads.

## Compliance
- System logs all data uploads, downloads, and user actions for audit.
- GDPR or local privacy compliance where applicable (PII minimization, deletion on request).

## Extensibility & Maintainability
- Modular architecture to support new data types, sources, analytics, and UI components.
- Automated tests for all critical business logic and endpoints.

---
