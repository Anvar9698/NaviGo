# Ambulance 103 Dispatch Module

## Overview

The **Tez Yordam 103** module is a separate section of Yo'l Ma'lumoti that provides intelligent ambulance dispatch across Tashkent and Fergana region hospitals. It shares the login/session, language, theme and text-size settings, the design system, and **the same MapContainer component** with the main application.

### Entry Point

- **URL:** `#/ambulance`
- **Header Link:** A red "🚑 Tez yordam 103" pill button in the main Header navigates to the ambulance page.
- **Back link:** An "← Yo'l Ma'lumoti" button in the ambulance header returns to the main app.

---

## Architecture

```
packages/shared/src/ambulance.ts       ← Types, AmbulanceRouteStep
apps/api/src/config.ts                 ← ambulance config block (ADDITIVE)
apps/api/src/db/ambulance.store.ts     ← In-memory store for hospitals, ambulances, bindings, requests
apps/api/src/services/ambulance.service.ts ← Dispatch logic, simulation, stats
apps/api/src/routes/ambulance.routes.ts    ← Express router mounted at /api/v1/ambulance
apps/api/src/tests/ambulance.test.ts       ← 7 automated tests

apps/web/src/lib/mapRegistry.ts        ← Tiny map instance registry
apps/web/src/ambulance/
  ├── ambulanceApi.ts                  ← Typed API client
  ├── AmbulanceApp.tsx                 ← Full page layout with role switcher
  ├── AmbulanceMapLayer.tsx            ← Map overlay (hospitals, ambulances, route, destination)
  ├── CitizenRequest.tsx               ← Emergency request form + live tracking card
  ├── DispatcherInbox.tsx              ← 60s countdown queue, accept/decline, fleet table
  └── DriverNavigation.tsx             ← Route preview, GO button, turn-by-turn, complete
```

### Existing files with SMALL additive edits

| File | Change |
|------|--------|
| `packages/shared/src/index.ts` | Added `export * from './ambulance'` |
| `packages/shared/src/i18n.ts` | Added `ambulance` dictionary keys in uz/ru/en |
| `apps/api/src/config.ts` | Added `ambulance` config block + `emergencyMax` rate limit |
| `apps/api/src/server.ts` | Imported `ambulanceRouter`, mounted at `/api/v1/ambulance`, added OpenAPI entries |
| `apps/web/src/components/MapContainer.tsx` | Added `variant` prop (`'default'`\|`'bare'`), registered map in `mapRegistry`, conditional skip of weather/incident/report markers |
| `apps/web/src/components/Header.tsx` | Added "Tez yordam 103" link pill |
| `apps/web/src/components/AuthModal.tsx` | Added quick demo login buttons for dispatcher & driver |
| `apps/web/src/App.tsx` | Hash route switch: `#/ambulance` → `<AmbulanceApp />`, else `<MainLayout />` |
| `.env.example` | Added ambulance environment variables |

---

## Dispatch Rules

### Entities

- **Hospital** — `{id, name, type: 'state'|'private', lat, lon, isDemo}`
- **AmbulanceUnit** — `{id, hospitalId, plateNumber, lat, lon, baseLat, baseLon, status}`
- **EmergencyRequest** — `{id, citizenId, lat, lon, description, severity, status, ...}`

### Ambulance Status Flow

```
free → assigned → enroute → onscene → free (done)
                                    ↘ busy / offline
```

### Request Status Flow

```
pending → assigned → enroute → onscene → done
       ↘ unassigned (no units) / cancelled
```

### Severity Levels

| Level | Meaning |
|-------|---------|
| 1 | Life-threatening |
| 2 | Serious |
| 3 | Not urgent |

### Dispatch Algorithm

1. **Create:** Find nearest hospital (Haversine) with ≥1 free ambulance, not already tried. Status → `pending`. Start 60s acceptance timer. If no hospital has a free unit → `unassigned` + "call 103 by phone" message.

2. **Accept:** Take up to 3 nearest free ambulances from accepting hospital, calculate road routes via OSRM for each, assign the **fastest** one. Others stay free.

3. **Decline / Timeout:** Add hospital to `triedHospitalIds`, forward to next nearest hospital with a free unit. If none remain → `unassigned`.

4. **Driver GO:** Request + ambulance → `enroute`. Simulation moves ambulance along the real route.

5. **Driver Arrived:** → `onscene`.

6. **Driver Complete:** → `done`, ambulance → `free`. Minutes saved calculated against baseline (nearest hospital ETA + 12-minute queue penalty).

### Duplicate Detection

Emergency calls within 150m and 5 minutes of an active call are flagged as duplicates and the existing call is returned.

---

## Roles & Authorization

The module does **not** add values to `UserRole`. Instead it uses a separate `AmbulanceStaffBinding`:

```typescript
interface AmbulanceStaffBinding {
  userId: string;
  staffRole: 'DISPATCHER' | 'DRIVER';
  hospitalId: string;
  ambulanceId?: string;  // for drivers
}
```

| Role | Access |
|------|--------|
| ADMIN (existing role) | Full access: manage hospitals, ambulances, bindings |
| DISPATCHER (binding) | See only their hospital's pending/active calls; accept/decline |
| DRIVER (binding) | See only their assigned request; GO/arrived/complete/GPS |
| CITIZEN (any USER) | Create/cancel own request; see own request + assigned ambulance position |
| ANALYST | Read-only aggregated stats, never descriptions |
| EDITOR | **No access** (403 Forbidden) |

### Demo Seeded Staff

| Email | Password | Staff Role | Hospital |
|-------|----------|-----------|----------|
| dispatcher@103.uz | Password123! | DISPATCHER | Tashkent Republican Emergency Center |
| driver@103.uz | Password123! | DRIVER | Tashkent Republican Emergency Center (Ambulance #101) |
| dispatcher-fergana@103.uz | Password123! | DISPATCHER | Fergana Regional Emergency Center |
| driver-fergana@103.uz | Password123! | DRIVER | Fergana Regional Emergency Center (Ambulance #201) |

---

## Seeded Hospitals

### Tashkent (4)
1. Republican Research Centre of Emergency Medicine (16-Gorbolnitsa) — state
2. Tashkent City 1st Clinical Emergency Hospital — state
3. Tashkent Medical Academy Emergency Clinic — state
4. Shox Med Emergency Care — private

### Fergana Region (7)
1. Fergana Regional Emergency Medical Center — state
2. Margilan City Emergency Department — state
3. Kokand City Emergency Medical Center — state
4. Quvasoy City Central Hospital — state
5. Rishton District Medical Association — state
6. Oltiariq District Central Hospital — state
7. Fergana Med Line Emergency Clinic — private

---

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `AMBULANCE_ACCEPT_TIMEOUT_SECONDS` | 60 | Seconds before dispatching to next hospital |
| `AMBULANCE_QUEUE_PENALTY_SECONDS` | 720 | Baseline queue penalty (12 min) for minutes-saved calc |
| `SIMULATE_AMBULANCES` | true | Enable simulation of ambulance movement along routes |
| `AMBULANCE_SIM_SPEEDUP` | 8 | Simulation speed multiplier |
| `AMBULANCE_RETENTION_DAYS` | 30 | Days before purging completed/cancelled requests |

---

## API Endpoints

All under `/api/v1/ambulance`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/state` | Optional | Polled live state filtered by user role (1.5s interval) |
| GET | `/stats` | Public | Aggregated performance statistics |
| POST | `/requests` | USER | Create emergency request (rate limited) |
| POST | `/requests/:id/cancel` | Owner/ADMIN | Cancel own request |
| POST | `/requests/:id/accept` | DISPATCHER/ADMIN | Accept and assign fastest ambulance |
| POST | `/requests/:id/decline` | DISPATCHER/ADMIN | Decline and forward to next hospital |
| POST | `/requests/:id/go` | DRIVER/ADMIN | Start transit |
| POST | `/requests/:id/onscene` | DRIVER/ADMIN | Mark arrival |
| POST | `/requests/:id/complete` | DRIVER/ADMIN | Close call, calculate minutes saved |
| POST | `/units/:id/location` | DRIVER/ADMIN | Update live GPS position |
| GET | `/hospitals` | AUTH | List all hospitals |
| GET | `/units` | AUTH | List ambulances (scoped to binding) |
| GET/POST/DELETE | `/bindings` | ADMIN | Manage staff bindings |

---

## Privacy & Security

- Patient descriptions are **never** logged in `console.log` or error messages.
- Sensitive location/description visible only to: citizen (own), hospital dispatcher, assigned driver.
- ANALYST sees only aggregated stats, never descriptions.
- 30-day retention purge for completed/cancelled requests.
- Rate limiting on emergency request creation (5 per 15 min window).
- Duplicate detection prevents spam (150m, 5 min).

---

## Tests

7 automated tests in `apps/api/src/tests/ambulance.test.ts`:

1. ✅ Correctly initializes Tashkent and Fergana hospitals with free ambulances
2. ✅ Binds staff roles without modifying UserRole enum
3. ✅ Accurately derives step positions along coordinates by accumulating distanceMeters
4. ✅ Detects duplicate emergency call within 150m created within 5 minutes
5. ✅ Runs complete dispatch lifecycle: Create → Accept → Go → Arrive → Complete with minutes saved calculation
6. ✅ Forwards request to next nearest hospital when dispatcher declines or times out
7. ✅ Strictly isolates state and hides sensitive patient description from unauthorized roles
