# Architectural Decision Records (ADR)

## ADR 01: Monorepo Architecture with npm Workspaces
- **Status:** Accepted
- **Context:** The Yol Ma'lumoti system consists of a public web client (`apps/web`), an API backend (`apps/api`), shared contracts (`packages/shared`), and infrastructure (`infra`).
- **Decision:** Use npm workspaces in the monorepo root. This ensures unified TypeScript type sharing without private npm registry dependencies while keeping backend and frontend builds decoupled.

## ADR 02: Resilient Data Storage (PostgreSQL + PostGIS with In-Memory Spatial Fallback)
- **Status:** Accepted
- **Context:** Production environments require PostgreSQL with PostGIS for spatial bounding box calculations, clustering, and duplicate detection. In local development on Windows, Docker Desktop may be inactive or take time to launch.
- **Decision:** Architect the data layer with an abstraction: when PostgreSQL is connected, use native PostGIS queries. In zero-dependency local mode, provide an embedded high-performance spatial store implementing Haversine distance and spatial clustering in Node.js.

## ADR 03: Open-Meteo as Free, Unauthenticated Real-Time Weather & AQI Provider
- **Status:** Accepted
- **Context:** The project requires real weather and air quality for Uzbekistan without requiring credit cards or API keys that expire.
- **Decision:** Integrate Open-Meteo Weather and Air Quality APIs directly, complete with caching and CC BY 4.0 attribution.

## ADR 04: Safe Human-in-the-Loop Community Map Updates
- **Status:** Accepted
- **Context:** Malicious or mistaken reports could mislead elderly drivers or emergency services.
- **Decision:** Direct client submissions cannot mutate public map layers. Editors triage community reports and formulate proposed changes; Administrators perform transactional approval and publication with full audit logging and one-click rollback.

## ADR 05: UI Token Fidelity and Older Adult Accessibility First
- **Status:** Accepted
- **Context:** The application must match the high-end soft dashboard design provided in the project prompt and design sheet.
- **Decision:** Adopt the exact design tokens: `#E7E4EA` background, `#F2EFF5` outer panel (radius 32px), `#FFFFFF` cards (radius 24px), `#E8593A` accent orange, `#151218` black pills, minimum 18px body font, and touch targets $\ge 56\text{px}$.
