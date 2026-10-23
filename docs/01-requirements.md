# 01 — Product & System Requirements

**Project:** Yol Ma'lumoti ("Road Information")  
**Target Region:** Uzbekistan (Tashkent & regional coverage) with global extensibility  
**Target Users:** General public with special emphasis on older adults and users requiring high-clarity accessibility; municipal transport editors, analysts, and administrators.

---

## 1. Functional Requirements (MVP)

### 1.1 Public Web App (Desktop & Phone / PWA)
1. **Immediate Map Load:** The application must open directly onto a responsive map of the user's area without requiring login, onboarding blocks, or modal popups.
2. **Geolocation Flow:**
   - Non-blocking location prompt banner with clear options: "Allow location" or "Choose place myself".
   - Default city view (Tashkent Center: 41.3111, 69.2797) when location is not granted.
   - GPS accuracy indicator: "Location: good" / "Location: approximate" / "Manual".
3. **Map Modes (Dual Mode):**
   - **Mode A (Environment & Weather):** Weather card with big temperature, plain-language description, Air Quality Index (AQI with methodology: European AQI / US AQI), PM2.5, PM10, 5-day forecast.
   - **Mode B (Roads & Transport):** Incidents, closures, road work, traffic congestion, and community reports.
   - Seamless toggle between Mode A, Mode B, or Combined view without losing map center or zoom level.
4. **Accessible Design for Older Adults:**
   - Click/tap targets $\ge 56 \times 56\text{px}$.
   - Minimum font size: titles 24-40px, body $\ge 18\text{px}$, smallest label 16px.
   - Dynamic text size adjuster slider (100% to 150%).
   - Theme toggle: Light (`#E7E4EA` background, `#FFFFFF` cards), Dark (`#0E0C10` background, `#1C191F` cards), and High Contrast (pure black & white with bold `#FFD700` focus outline).
   - "Reduce motion" preference support (`prefers-reduced-motion` and toggle).
   - Non-color-alone rule: status is always conveyed by an icon AND a written label.
   - List alternative view: a complete accessible list of road conditions and weather for users who cannot navigate a visual map or use screen readers.
5. **Community Road Reporting (3-Step Flow):**
   - Step 1: Select category (Road damage, unexpected closure, construction/repair, obstruction/hazard, signage issue, transport disruption, map error).
   - Step 2: Confirm location pin on map, optional photo attachment (with warning: "Please do not take photos while walking or driving"), optional text note with voice input option.
   - Step 3: Review and submit with instant tracking reference.
6. **Report Tracking ("My Reports"):**
   - Track status: `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Approved / Published` $\rightarrow$ `Resolved`.
   - View reviewer feedback and updates.
7. **AI Support Assistant with Human Escalation:**
   - Chat assistant explaining road alerts and app navigation in plain language (Uzbek, Russian, English).
   - Persistent "Talk to a person" button to escalate to human editors.
   - AI honesty boundary: strictly does not invent road conditions; answers only from verified system data.
8. **Internationalization (i18n):**
   - Full support for **Uzbek (Latin)**, **Russian**, and **English**.
   - Language selector readily available in the top pill bar (desktop) and mobile settings/header.

### 1.2 Community Verification & Admin Pipeline
1. **Report Isolation:** Community reports NEVER directly modify the public map.
2. **Review Lifecycle:**
   `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `TRIAGED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED / REJECTED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `RESOLVED / EXPIRED`.
3. **Editor Workspace:**
   - Inbox of pending reports with duplicate detection signals (distance, time window, category).
   - Photo inspection and coordinate verification.
   - Ability to create a **Proposed Map Change** (with before/after diff) and submit to Admin.
4. **Admin Console:**
   - Final review and transactional publication of proposed map changes.
   - Rollback and expiration management.
   - System and provider health status dashboard.
   - User role management and full immutable audit log.
5. **Analyst Workspace:**
   - Aggregated incident metrics, category breakdown charts, geographical incident heatmaps, and exportable reports (preserving privacy through spatial clustering).

---

## 2. Non-Functional Requirements

1. **Accessibility:** WCAG 2.2 AA compliant minimum; WCAG AAA text contrast where feasible.
2. **Performance:** Sub-2-second Time to Interactive on mid-tier mobile devices; MapLibre GL bundle optimization.
3. **Security:** OWASP ASVS aligned; Argon2id/bcrypt password hashing; CSRF protection; Content Security Policy; strict input validation with Zod.
4. **Data Privacy:** Foreground-only geolocation by default; no persistent coordinate tracking; EXIF stripping on uploaded media; GDPR/Uzbek privacy compliance readiness.
5. **Honesty & Transparency:** Every incident and metric displays its source (Live, Community, Official) and last-updated timestamp.
