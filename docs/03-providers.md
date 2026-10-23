# 03 — Data Provider Evaluation & Decision Matrix

This document defines the external provider adapters, evaluating capabilities, coverage in Uzbekistan, rate limits, licensing, and honest fallback behaviors.

---

## 1. Provider Adapter Strategy

All external services are accessed via TypeScript abstract interfaces:
`WeatherProvider`, `AirQualityProvider`, `GeocodingProvider`, `RoutingProvider`, `TrafficProvider`, `TransitProvider`, `AIProvider`.

Every adapter implements:
- Timeout limits (default: 3500ms)
- In-memory/Redis response caching with TTL
- Circuit breaker / Graceful fallback on network failure or rate limit
- Last successful synchronization tracking (exposed on the Admin Provider Health widget)

---

## 2. Provider Evaluation

### 2.1 Weather & Air Quality: **Open-Meteo**
- **Capabilities:** Hourly & daily forecasts, temperature, precipitation, wind, UV index, PM2.5, PM10, European AQI, and US AQI.
- **Coverage in Uzbekistan:** Complete coordinate-based coverage (Tashkent `41.3111, 69.2797`, Samarkand, Bukhara, etc.).
- **License / Cost:** Free for non-commercial and standard usage under CC BY 4.0; no mandatory API key.
- **Attribution:** "Weather data by Open-Meteo.com" prominently rendered on the weather card.
- **Decision:** **Adopted as primary provider.**
- **Fallback:** If API is unreachable, return last cached snapshot with an explicit "Cached data from [Timestamp]" badge.

### 2.2 Geocoding & Address Search: **OpenStreetMap Nominatim**
- **Capabilities:** Reverse geocoding (coordinates $\rightarrow$ street address) and forward search (place name $\rightarrow$ coordinates).
- **Coverage:** Excellent worldwide and strong in Uzbekistan urban centers.
- **Licensing & Policy:** Requires custom User-Agent identifying the app, strict maximum of 1 request/sec rate limit, client-side debouncing (minimum 400ms delay), and caching of repeated queries.
- **Decision:** **Adopted as primary provider** with strict backend rate limiter and server-side cache.

### 2.3 Base Map Tiles: **Carto / OpenStreetMap via MapLibre GL JS**
- **Capabilities:** Fast raster/vector tiles with crisp rendering, high contrast capability, zero proprietary lock-in.
- **Attribution:** "© OpenStreetMap contributors, © CARTO" displayed on map bottom-left.
- **Decision:** **Adopted.**

### 2.4 Routing: **OSRM (Open Source Routing Machine)**
- **Capabilities:** Car, Walking, and Cycling route geometry, distance, and duration.
- **Honesty Rule:** Turn-by-turn maneuvers are only announced if real geometry step instructions are returned. If unavailable, provide route distance & estimated travel duration with standard overview path.

### 2.5 Live Traffic: **Honest Fallback Protocol**
- **Status:** Dedicated commercial traffic APIs (TomTom / HERE) require enterprise subscriptions.
- **Honesty Decision:** In the absence of an active commercial key, the system does NOT invent traffic lines. It displays:
  > *"Live continuous traffic feed is not connected in this area. Showing verified community and official road incidents."*
  Incidents reported and verified through our Editor/Admin pipeline are rendered with distinct red/orange/yellow road markers.

---

## 3. Provider Summary Table

| Domain | Selected Provider | Auth Required | Cache TTL | Fallback Behavior |
|---|---|---|---|---|
| Weather | Open-Meteo | None | 15 minutes | Last known cached snapshot with warning |
| Air Quality | Open-Meteo AQ | None | 30 minutes | Last known cached snapshot with warning |
| Geocoding | OSM Nominatim | None (Custom UA) | 24 hours | Manual coordinate pin selection |
| Map Tiles | Carto / OSM | None | Browser cache | Offline vector shell |
| Routing | OSRM / Local | None | 10 minutes | Straight-line distance estimate with warning |
| Traffic | Community + Provider | Optional | 2 minutes | Explicit honest "Unconnected" status indicator |
