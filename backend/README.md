# YesFly_v1 Backend

## Overview

The YesFly_v1 backend is a geospatial API service that provides drone flight restriction information based on location and altitude queries.

The system is designed to support drone pilots by aggregating regulatory data while maintaining a strict separation between:

- Human-verified legal restriction data
- Contextual information such as parcel boundaries
- AI-assisted document discovery (non-legal-determination role)

The backend is built using:

- Runtime: Node.js
- Framework: Express-style routing
- Database: Supabase-hosted PostgreSQL
- Query Driver: node-postgres (`pg` library)

Primary external dependency:

- Database hosting and infrastructure management provided by Supabase.

---

## Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Backend Framework | Express |
| Database Host | Supabase |
| Query Client | node-postgres |
| Environment Configuration | dotenv |

Key Database Extension (Future):

- :contentReference[oaicite:0]{index=0} for geospatial polygon querying.

---

## Project Architecture

The backend follows a layered architecture:

Request
↓
Middleware Pipeline
↓
Route Handler
↓
Service Logic (future)
↓
Database Query Layer
↓
Response Output


### Core Design Principles

### 1. Human-Verified Regulatory Authority

The system does NOT:

- Determine legal flight permission using AI inference.

The system DOES:

- Return restriction data curated and verified by human research.

---

### 2. Spatial Query Optimization (Future Phase)

The backend is being designed to support:

- Point-in-polygon detection
- Altitude filtering
- Temporal restriction validation

These features will rely on geospatial indexing.

---

## Folder Structure

backend/
├── src/
│ ├── config/
│ │ └── db.ts
│ │
│ ├── routes/
│ │ └── (API routes)
│ │
│ ├── services/
│ │ └── (business logic layer)
│ │
│ └── index.ts
│
├── package.json
├── tsconfig.json
└── .env


---

## Environment Variables

Create a `.env` file in backend root:

DATABASE_URL=your_supabase_postgres_url
PORT=3000

## Database Connection

Database connections are managed using connection pooling via:

pg.Pool

Features:

Prevents excessive connection creation

Supports concurrent API requests

Enables scalable query handling

SSL is enabled for remote database connections.

## API Endpoints

Health Check

GET /

{
  "message": "Operational"
}

Database Connection Test

GET /test_db

Returns current database timestamp.

Used only for debugging infrastructure connectivity.

## Security Design

Input Protection

Parameterized SQL queries are required.

No dynamic SQL string concatenation.