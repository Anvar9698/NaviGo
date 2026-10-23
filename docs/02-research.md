# 02 — Competitor & Problem Research

**Context:** Digital navigation and road information in Central Asia / Uzbekistan (Tashkent focal point).  
**Primary Competitors Reviewed:** Yandex Maps, 2GIS, Google Maps, OpenStreetMap (Organic Maps).

---

## 1. Problem Hypotheses & Verification

| Hypothesis | Observed Problem in Existing Apps | Affected Users | Yol Ma'lumoti Solution |
|---|---|---|---|
| **Interface Complexity** | Too many cluttered promo pins, advertising banners, tiny buttons ($<36\text{px}$), and buried transit options. | Older adults, low digital literacy, motor impairment | Clean, calm UI; $\ge 56\text{px}$ touch targets; high contrast; dedicated accessibility mode. |
| **Stale / Unverified Closures** | Road closures from utility repairs in Tashkent often appear late or persist weeks after reopening. | Drivers, transit riders | Dual verification workflow (Editor $\rightarrow$ Admin); validity windows with auto-expiry. |
| **Environmental Freshness** | Air quality is either missing or shown as an uncontextualized number without health guidance. | Elderly with respiratory issues, parents | Real-time Open-Meteo Air Quality (PM2.5/PM10) with plain-language actionable advice. |
| **Opaque Data Sources** | Users cannot tell if an accident marker is live, user-submitted, or a scheduled closure. | All users | Strict source badges on every card: `[Official]`, `[Live]`, or `[Reported by people]`. |
| **Intrusive Location Tracking** | Apps require continuous background location permissions even for basic browsing. | Privacy-conscious users | Foreground-only location by default; seamless manual city/district picker. |
| **Hard to Report Issues** | Submitting a report requires 8+ obscure steps and text typing. | On-the-go citizens | 3-step reporting flow with visual category tiles and optional voice notes. |

---

## 2. Competitive Gap Analysis

| Feature | Yandex Maps | 2GIS | Google Maps | Yol Ma'lumoti |
|---|---|---|---|---|
| **Older Adult Sizing & Tokens** | ❌ Standard | ❌ Standard | ❌ Standard | ✅ **Built-in $\ge 18\text{px}$, 56px touch targets** |
| **List Alternative for Maps** | ❌ No | ❌ No | ❌ No | ✅ **Full accessible list view** |
| **Clear Data Provenance** | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ✅ **Every item labeled with origin** |
| **Community Verification Pipeline** | ⚠️ Proprietary | ⚠️ Closed | ⚠️ Slow crowdsource | ✅ **Transparent Editor $\rightarrow$ Admin audit** |
| **Weather & Road Dual-Mode** | ❌ Separate | ❌ Separate | ⚠️ Weather chip only | ✅ **Seamless Mode A & B map integration** |
| **Zero Account Map Access** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Yes (account only for reports/admin)** |

---

## 3. Product Priorities (Backlog Ranking)
1. **P0 (MVP):** MapLibre GL map opening directly on Tashkent/current position, weather + air quality cards, road incident list & map markers, accessible UI system, 3-step reporting, Editor/Admin approval workflow.
2. **P1:** Routing preview (Walk/Transit/Drive), Voice navigation guidance, AI support assistant.
3. **P2:** Real-time GTFS feeds when available; PWA offline tile caching.
