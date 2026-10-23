# 00 — Repository Audit & Discovery

**Date:** October 2026  
**Auditor:** Principal Software Architect, Yol Ma'lumoti  
**Scope:** Initial state evaluation for Yol Ma'lumoti project build.

---

## 1. System & Environment Audit

| Component | Detected Version | Status / Notes |
|---|---|---|
| **OS** | Windows 10/11 | Active workspace host |
| **Node.js** | `v24.14.0` | Supported LTS/Current; modern ES syntax, built-in test runner, fetch available |
| **npm** | `11.9.0` | Supported; native workspace support |
| **Git** | `2.54.0.windows.1` | Initialized / Available |
| **Docker** | `29.6.2` (Client installed; Daemon inactive) | Docker compose configs provided; local zero-friction fallback required |
| **Design Reference** | Provided high-res UI specification sheet | Desktop & mobile layouts, tokens, color system, dark/high-contrast modes |

---

## 2. Repository State

- **Current Repository:** Fresh repository initialized at `C:\Users\99833\.gemini\antigravity\scratch\yol-malumoti`.
- **Existing Code:** None. Starting fresh with clean monorepo architecture (`apps/web`, `apps/api`, `packages/shared`, `infra`, `docs`).
- **Defects / Technical Debt:** None (greenfield project).

---

## 3. Technology & Architecture Decisions

1. **Workspace Architecture:** npm workspaces monorepo containing:
   - `apps/web`: React 18+ with Vite, Tailwind CSS, MapLibre GL JS, Lucide icons, i18next (UZ, RU, EN), accessible headless primitives, PWA manifest and service worker.
   - `apps/api`: Node.js + Express/TypeScript with strict Zod validation, OpenAPI specification, Argon2/bcrypt password hashing, JWT sessions with rotating refresh tokens, rate-limiting, and provider adapters.
   - `packages/shared`: Shared TypeScript types, design tokens, permission matrix, and data contracts.
   - `infra`: Docker compose (PostgreSQL + PostGIS, Redis, MinIO) + Dockerfiles.
2. **Database Strategy:**
   - Primary: PostgreSQL with PostGIS extensions.
   - Zero-dependency local developer fallback: SQLite/in-memory spatial store with mathematical spatial queries (haversine, bounding box, spatial clustering) that replicates PostGIS queries when Docker daemon is not active.
3. **External Providers (Real integrations):**
   - **Weather & Air Quality:** Open-Meteo API (free for non-commercial/standard use, no API key required, reliable Tashkent & global coverage).
   - **Base Map & Tiles:** OpenStreetMap via Carto / MapLibre open raster & vector tiles with required attribution.
   - **Geocoding:** OpenStreetMap Nominatim with strict rate limiting (1 request/sec) and caching.
   - **Routing:** OSRM (Open Source Routing Machine) public demo endpoints with fallback.
   - **Honest Fallback Rule:** For unauthenticated/unconnected live traffic feeds, clear indicators state "Live traffic is not connected in this area; showing verified reports."

---

## 4. What to Keep / What to Build Next

- Proceed immediately to write formal contracts (`/docs/01-requirements.md`, `/docs/02-research.md`, `/docs/03-providers.md`, `/docs/architecture/*`).
- Proceed to **Milestone M1 (Foundation)** to scaffold the workspace, shared design tokens, backend API, and public web app.
