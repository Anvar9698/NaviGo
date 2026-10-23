# Access Control & RBAC Matrix

## 1. System Roles

The system strictly enforces role-based access control (RBAC) at the API middleware level.

1. **`ANONYMOUS` (Public Visitor):**
   - No authentication required.
   - Immediate access to view public map, weather, air quality, published road incidents, and transit information.
2. **`USER` (Authenticated Citizen):**
   - Authenticated account.
   - Can submit road reports, view and track their own submitted reports, participate in AI support, manage personal profile, delete/export personal data.
3. **`EDITOR` (Verification Staff):**
   - Access to report triage inbox, duplicate detection tools, and evidence viewer.
   - Can triage, verify, or request info on community reports.
   - Can draft a **Proposed Map Change** and submit it to Administrator for review.
   - Cannot directly publish or modify the public map.
4. **`ANALYST` (Data & Traffic Analyst):**
   - Read-only access to aggregated analytics, incident density heatmaps, resolution times, and export tools.
   - Cannot view individual precise location histories or modify records.
   - Can request new analytics definitions from Administrator.
5. **`ADMIN` (System Administrator):**
   - Full governance: approve or reject proposed map changes (transactional publish).
   - Rollback published map updates.
   - Manage user roles, inspect audit logs, configure provider integrations and system settings.

---

## 2. Endpoint Authorization Matrix

| Endpoint Route | Method | Anonymous | User | Editor | Analyst | Admin |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `/api/v1/auth/register` | POST | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/api/v1/auth/login` | POST | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/auth/me` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/weather` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/air-quality` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/map/features` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/map/geocode` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/map/route` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/reports` | POST | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/reports/my` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/reports/:id` | GET | ❌ | Own | ✅ | ✅ | ✅ |
| `/api/v1/editor/reports` | GET | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/api/v1/editor/reports/:id/triage` | POST | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/api/v1/editor/map-changes` | POST | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/api/v1/admin/map-changes/approve` | POST | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/v1/admin/map-changes/rollback`| POST | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/v1/admin/users` | GET/PATCH | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/v1/admin/audit-log` | GET | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/v1/admin/provider-health` | GET | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/v1/analytics/overview` | GET | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/api/v1/analytics/heatmaps` | GET | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/api/v1/support/chat` | POST | ❌ | ✅ | ✅ | ✅ | ✅ |
