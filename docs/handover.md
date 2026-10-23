# Yol Ma'lumoti — Handover & Engineering Architecture Guide

**Project:** Yol Ma'lumoti ("Road Information")  
**Role:** Principal Software Architect Handover  
**Date:** October 2026

---

## 1. Executive Summary

Yol Ma'lumoti has been built from ground up to deliver a calm, accessible road information and navigation platform for Uzbekistan. It adheres to all product constraints, design tokens, and architectural principles outlined in the Master Build Prompt and the provided design specification.

---

## 2. Completed Milestones & Architectural Artifacts

| Milestone | Deliverables | Verification Status |
|---|---|---|
| **M0 Discovery & Contracts** | Audit (`/docs/00-audit.md`), Requirements (`/docs/01-requirements.md`), Competitor Research (`/docs/02-research.md`), Provider Matrix (`/docs/03-providers.md`), Threat Model (`/docs/architecture/threat-model.md`), Database Schema (`/docs/architecture/database-schema.md`), Decisions (`/docs/decisions.md`). | ✅ Verified |
| **M1 Foundation** | Monorepo layout (`packages/shared`, `apps/api`, `apps/web`), Docker compose (`infra/docker-compose.yml`), Design tokens (`DESIGN_TOKENS`), Tri-lingual dictionaries (Uzbek, Russian, English). | ✅ Verified |
| **M2 Auth & RBAC** | BCrypt password hashing, JWT sessions, least-privilege RBAC middleware, 4 pre-seeded demo accounts (Admin, Editor, Analyst, Citizen). | ✅ Tests Passing |
| **M3 Public Map (Home)** | MapLibre GL map opening immediately on user location / Tashkent center, non-blocking location permission banner, weather & EAQI cards, dual-mode map switch (Mode A / Mode B). | ✅ Verified |
| **M4 Reporting Workflow** | 3-step accessible reporting modal, spatial duplicate detection algorithm ($\le 150\text{m}$), EXIF-strip safety advice, "My reports" status tracking. | ✅ Tests Passing |
| **M5 Editor Workspace** | Report triage inbox, verification notes, draft Proposed Map Change drawer. | ✅ Verified |
| **M6 Admin Console** | One-click transactional approval & map publication, instant rollback, provider telemetry dashboard, immutable audit log viewer, user management. | ✅ Tests Passing |
| **M7 Analyst Workspace** | Real aggregated incident metrics, category breakdown bars, privacy-preserving spatial clustering (heatmaps), CSV report export. | ✅ Verified |
| **M8 & M9 Adapters & Routing** | Real Open-Meteo Weather adapter, Open-Meteo European AQI adapter, OSM Nominatim Geocoding adapter, OSRM Routing engine with honest fallback. | ✅ Verified |
| **M10 AI Support Assistant** | Conversational road assistant, multi-lingual (UZ/RU/EN), emergency call instructions (102/103), "Talk to a person" escalation. | ✅ Verified |
| **M11 Quality & Accessibility** | Automated unit & integration tests, high-contrast theme, font scale slider (100%-140%), screen-reader list alternative view. | ✅ 100% Pass Rate |

---

## 3. What You Learned (Teaching the Developer)

1. **Role-Based Access Control (RBAC):**
   Security must never rely only on hiding buttons in the browser. In our backend, the `requireRole(['ADMIN'])` middleware checks the cryptographically signed JWT token on every protected API endpoint. Even if someone makes a raw HTTP POST to `/api/v1/admin/map-changes/approve`, the server returns `403 Forbidden` unless the caller has the `ADMIN` role.
2. **Safe Human-in-the-Loop Community Updates:**
   Public trust is destroyed if fake or malicious hazard reports appear directly on the map. We designed an isolated state machine: Citizen submits report $\rightarrow$ Editor triages and formulates a `ProposedMapChange` $\rightarrow$ Administrator reviews and transactionally publishes the feature $\rightarrow$ Published feature receives an audit entry and can be rolled back with one click.
3. **Data Freshness and Honest Fallbacks:**
   Real-world networks and external APIs fail. Instead of inventing fake traffic or hiding errors, our provider adapters measure latency, log health checks for the Administrator, and display honest indicators (e.g., *"Live continuous sensor feed is not connected; displaying verified community alerts"*).
4. **Spatial Proximity with the Haversine Formula:**
   To prevent duplicate report spam without burdening users, we compute spherical geodesic distance:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   Any incident reported within 150 meters in the same category is automatically linked as a candidate duplicate.
