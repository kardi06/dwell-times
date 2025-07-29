# Dwell-Insight Analytics Platform

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Conda (for Python environment management)

### Setup
1. Clone the repository
2. Run setup script: `./scripts/dev-setup.sh` (Linux/macOS) or `scripts\dev-setup.bat` (Windows)
3. Start development servers: `./scripts/start-dev.sh` (Linux/macOS) or `scripts\start-dev.bat` (Windows)

### Development
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- API Documentation: http://localhost:8000/docs

### Testing
- Backend tests: `cd backend && pytest`
- Frontend tests: `cd frontend && npm test`