# Threat Model & Security Specification

**Standard:** Aligned with OWASP ASVS v4.0 and OWASP Top 10  
**Target:** Yol Ma'lumoti Public Web & API

---

## 1. Threat Identification & Mitigations

| Threat ID | Threat Description | Attack Vector | Security Mitigation |
|---|---|---|---|
| **TH-01** | Password Cracking & Credential Stuffing | Brute force against `/auth/login` | Argon2id/bcrypt hashing with salt; progressive delay; IP-based and username-based rate limits; generic error message ("Invalid credentials"). |
| **TH-02** | Session Hijacking & Token Theft | XSS or network eavesdropping | Access tokens stored in secure in-memory or `HttpOnly, Secure, SameSite=Lax` cookies; rotating refresh tokens; full session invalidation on logout. |
| **TH-03** | Unauthorized Map Modification | Attacker submits fake closure or deletes roads | **Strict Separation:** Community reports do NOT modify public map. Only Editor can draft change; only Admin can publish. All mutations logged in immutable audit table. |
| **TH-04** | Location Privacy Leakage | Continuous tracking exposes user homes or routes | **Foreground-only location.** The client requests location strictly when needed; no persistent coordinate history stored for browsing; coordinates only stored for submitted reports. |
| **TH-05** | Malicious File Uploads | Uploading executable scripts or malware disguised as photos | Strict MIME type validation (JPEG/PNG/WebP only); file size capped at 5MB; image re-encoding; **automatic stripping of EXIF/GPS metadata** from public images. |
| **TH-06** | Server-Side Request Forgery (SSRF) | Forcing backend to request internal resources via provider proxy | Hardcoded allowlist of outbound domains: `api.open-meteo.com`, `nominatim.openstreetmap.org`, `router.project-osrm.org`. No user-supplied URLs allowed in fetch. |
| **TH-07** | Automated Abuse / Flood Reporting | Bot generating thousands of false reports | Rate limiting on `/reports` (max 5 reports per user per hour); duplicate detection via spatial proximity & time window; captcha/re-auth on suspicious patterns. |
| **TH-08** | Insecure Direct Object References (IDOR) | User viewing other citizens' private reports or support chats | Backend query filters strictly enforce `reporter_id = current_user.id` unless caller has `EDITOR` or `ADMIN` role. |

---

## 2. Security Headers & Content Security Policy (CSP)

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; connect-src 'self' https://api.open-meteo.com https://air-quality-api.open-meteo.com https://nominatim.openstreetmap.org https://router.project-osrm.org;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=(self)
```
