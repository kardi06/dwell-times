# Project Setup & Development Environment

**Story ID:** SETUP-001  
**Created:** 2025-01-27  
**Story Points:** 5 (Medium - infrastructure setup)  
**Priority:** Critical (Foundation for all other stories)

---

## **User Story**

**As a** development team  
**I want to** have a properly configured development environment with all necessary tools and project structure  
**So that** we can efficiently develop and test the Dwell-Insight analytics platform

---

## **Acceptance Criteria**

### 1. Project Structure Setup
- [ ] Create proper directory structure for full-stack application
- [ ] Set up separate folders for frontend, backend, and shared components
- [ ] Configure proper file organization following best practices
- [ ] Set up documentation structure in docs/ folder
- [ ] Create README.md with project overview and setup instructions

### 2. Frontend Development Environment
- [ ] Initialize React + TypeScript project with Vite
- [ ] Configure ESLint and Prettier for code quality
- [ ] Set up Material UI or Chakra UI component library
- [ ] Configure development server with hot reload
- [ ] Set up build process for production deployment
- [ ] Configure environment variables for different environments

### 3. Backend Development Environment
- [ ] Initialize Python FastAPI project structure
- [ ] Set up virtual environment and dependency management
- [ ] Configure database connection (PostgreSQL)
- [ ] Set up authentication system foundation
- [ ] Configure API documentation with Swagger/OpenAPI
- [ ] Set up development server with auto-reload

### 4. Database Setup
- [ ] Install and configure PostgreSQL database
- [ ] Create initial database schema for MVP features
- [ ] Set up database migrations system
- [ ] Configure connection pooling and optimization
- [ ] Create database backup and restore procedures

### 5. Development Tools & Configuration
- [ ] Set up Git repository with proper branching strategy
- [ ] Configure environment variables (.env files)
- [ ] Set up logging system for both frontend and backend
- [ ] Configure error handling and debugging tools
- [ ] Set up testing framework (Jest for frontend, pytest for backend)

### 6. DevOps & Deployment Preparation
- [ ] Create Docker configuration for containerization
- [ ] Set up CI/CD pipeline configuration
- [ ] Configure production deployment scripts
- [ ] Set up monitoring and health check endpoints
- [ ] Create deployment documentation

---

## **Technical Requirements**

### Project Structure
```
dwell-insight/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── package.json
├── backend/                  # FastAPI + Python
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── requirements.txt
├── docs/                     # Documentation
├── docker/                   # Docker configurations
├── scripts/                  # Build and deployment scripts
└── README.md
```

### Frontend Setup
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite for fast development
- **UI Library:** Material UI or Chakra UI
- **State Management:** React Context or Redux Toolkit
- **HTTP Client:** Axios or React Query
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier

### Backend Setup
- **Framework:** FastAPI with Python 3.11+
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** JWT with python-jose
- **Data Processing:** Pandas for analytics
- **Testing:** pytest with async support
- **Documentation:** Swagger/OpenAPI auto-generation
- **Validation:** Pydantic for data validation

### Database Schema (Initial)
```sql
-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Camera events table
CREATE TABLE camera_events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    person_id VARCHAR(100) NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    dwell_duration INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics cache table
CREATE TABLE analytics_cache (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(50) NOT NULL,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## **Definition of Done**

- [ ] Project structure is properly organized and documented
- [ ] Frontend development environment runs without errors
- [ ] Backend API server starts and responds to health checks
- [ ] Database is accessible and schema is created
- [ ] Development servers can be started with single commands
- [ ] Code linting and formatting is configured
- [ ] Basic testing framework is set up
- [ ] Environment variables are properly configured
- [ ] Git repository is initialized with proper .gitignore
- [ ] README.md contains clear setup instructions
- [ ] Docker configuration is ready for containerization

---

## **Dependencies**

- Node.js 18+ and npm/yarn installed
- Python 3.11+ and pip installed
- PostgreSQL 14+ installed and running
- Git for version control
- Docker (optional for containerization)

---

## **Notes**

This story establishes the foundation for all future development work. It's critical to get this right as it affects the entire development workflow.

**Key Success Metrics:**
- Development environment setup time < 30 minutes for new developers
- Hot reload works for both frontend and backend
- Database connection is stable and fast
- All linting and formatting rules are enforced

**Future Considerations:**
- Environment setup should support multiple developers
- Configuration should be environment-agnostic
- Database migrations should be automated
- CI/CD pipeline should be ready for future stories

---

## **Story Breakdown (Optional)**

If this story needs to be broken down further:

1. **Project Structure & Documentation** (1 point)
2. **Frontend Environment Setup** (2 points)
3. **Backend Environment Setup** (2 points)
4. **Database & DevOps Setup** (2 points)

---

**Status:** Ready for Development  
**Assigned To:** TBD  
**Sprint:** Setup Sprint 1 