# Yo'l Ma'lumoti — Road Information & Mobility Platform

> **Accessibility-first road conditions, weather, air quality, community reporting, and municipal verification platform for Uzbekistan.**

Built following the high-end soft dashboard design specification and the comprehensive master build prompt.

---

## 🌟 Key Features

- **Instant Map & Live Atmosphere:** MapLibre GL map opening immediately on Tashkent (`41.3111, 69.2797`) or your location without requiring account sign-in.
- **Dual-Mode Visualization:**
  - **Mode A (Environment):** Real Open-Meteo Weather, 5-day forecast, and European Air Quality Index (EAQI) with PM2.5/PM10.
  - **Mode B (Roads):** Accidents, traffic congestion, closures, and road work with provenance tags (`[Live]`, `[Official]`, `[Reported by people]`).
- **Designed for Older Adults (WCAG 2.2 AA):**
  - $\ge 56\text{px}$ touch targets
  - Minimum 18px body font
  - Dynamic font-scaler slider (100% to 140%)
  - High-Contrast Senior Mode (pure black/white + yellow `#FFD700` focus outlines)
  - Accessible Text List View Alternative for screen readers
- **Safe Community Map Updates:**
  - 3-step report flow with automatic spatial duplicate detection ($\le 150\text{m}$)
  - Editor triage inbox $\rightarrow$ Proposed Map Change $\rightarrow$ Administrator approval $\rightarrow$ Transactional publication
  - One-click feature rollback and immutable audit logging
- **AI Road Support Assistant:**
  - Tri-lingual support (Uzbek Latin, Russian, English)
  - Emergency call instructions (102 Police / 103 Ambulance)
  - "Talk to a person" human dispatcher handoff
- **Multi-Role Workspaces:** Built-in panels for Administrator, Road Editor, Data Analyst, and Citizen.

---

## 🚀 Quick Start (Windows)

```powershell
# 1. Install dependencies
npm install

# 2. Build all workspaces
npm run build --workspace=@yol/shared
npm run build --workspace=@yol/api
npm run build --workspace=@yol/web

# 3. Run automated tests
node --test apps/api/dist/tests/api.test.js

# 4. Start backend API (Terminal 1)
cd apps/api
npm start

# 5. Start frontend UI (Terminal 2)
cd apps/web
npm run dev
```

Visit **http://localhost:3000** in your browser!

---

## 📚 Documentation

- [System Audit](/docs/00-audit.md)
- [Requirements](/docs/01-requirements.md)
- [Competitor Research](/docs/02-research.md)
- [Provider Evaluation](/docs/03-providers.md)
- [Architecture & Threat Model](/docs/architecture/architecture.md)
- [RBAC Permission Matrix](/docs/architecture/permissions.md)
- [Setup & Windows Commands](/docs/setup-guide.md)
- [Accessibility Statement](/docs/accessibility-statement.md)
- [Handover Guide](/docs/handover.md)
