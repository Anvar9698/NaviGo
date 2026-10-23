# Yol Ma'lumoti — Local Setup & Execution Guide (Windows)

This document provides exact step-by-step commands to install, build, test, and run the **Yol Ma'lumoti** application on Windows.

---

## 1. Prerequisites

- **Node.js:** v20+ (Verified on `v24.14.0`)
- **npm:** v10+ (Verified on `11.9.0`)
- **Docker & Docker Compose** (Optional for local development; required for containerized production)

---

## 2. Quick Start Commands

Open PowerShell in the project root: `C:\Users\99833\.gemini\antigravity\scratch\yol-malumoti`

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Build Shared Packages, API, and Frontend
```powershell
# Build shared contracts
npm run build --workspace=@yol/shared

# Build backend API
npm run build --workspace=@yol/api

# Build public frontend web app
npm run build --workspace=@yol/web
```

### Step 3: Run Unit & Integration Tests
```powershell
node --test apps/api/dist/tests/api.test.js
```

### Step 4: Launch Applications for Development

**Terminal 1 (Backend API):**
```powershell
cd apps/api
npm start
# Server listens on http://localhost:4000
# OpenAPI specification available at: http://localhost:4000/api/v1/openapi.json
# Health check available at: http://localhost:4000/health
```

**Terminal 2 (Frontend Client):**
```powershell
cd apps/web
npm run dev
# Vite development server starts at http://localhost:3000
```

---

## 3. Demo User Accounts

You can test any role instantly using the "Demo Quick Access" buttons inside the Sign In modal or with these credentials:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Administrator** | `admin@yol.uz` | `Password123!` | Approve/publish proposed map changes, rollback features, view audit log, check provider health |
| **Road Editor** | `editor@yol.uz` | `Password123!` | Triage community reports, verify evidence, draft proposed map changes |
| **Data Analyst** | `analyst@yol.uz` | `Password123!` | View aggregated metrics, category distribution, spatial density heatmaps, export CSV |
| **Citizen User** | `citizen@yol.uz` | `Password123!` | Submit 3-step road reports, track report statuses in "My reports" |

---

## 4. Containerized Deployment (Docker Compose)

To start the full production stack with PostgreSQL + PostGIS, Redis, MinIO, API, and Nginx Web:
```powershell
cd infra
docker compose up -d
```
