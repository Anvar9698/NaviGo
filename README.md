# NaviGo — Smart Road Navigation & Municipal Emergency Response Platform

> **Next-generation intelligent road mobility, CNG/LPG (Metan/Propan) live station telemetry, V2X "Yashil Yo'lak" (Green Corridor) emergency priority, weather & air quality atmosphere, and 5-tier emergency dispatch (103, 102, 101, 104, 1050) ecosystem tailored for Uzbekistan.**

Built for competition presentation, real-world accessibility (WCAG 2.2 AA), and cross-agency municipal operations.

---

> [!IMPORTANT]
> ### 🏆 Hakamlar hay'ati diqqatiga / Важная информация для жюри / Notice for Competition Judges
>
> * 🇺🇿 **O'zbekcha:** Mazkur **NaviGo** platformasi hozircha **faqat O'zbekiston hududi uchun maxsus ishlab chiqilgan** (Metan/Propan kompressor bosimi va navbat telemetriyasi, V2X favqulodda "Yashil Yo'lak" radari, 103/102/101/104/1050 milliy dispetcherlik tizimi hamda respublika yo'l infratuzilmasi). O'zbekiston hududidan tashqarida loyiha kutilgandek ishlamasligi mumkin. Tizimning barcha aqlli imkoniyatlarini to'laqonli sinab ko'rish uchun **brauzerda GPS joylashuvga (geolokatsiyaga) ruxsat berishni tavsiya etamiz** (yoki qidiruv orqali Toshkent, Samarqand, Buxoro, Andijon, Farg'ona, Namangan kabi shaharlarimizni tanlang).
>
> * 🇷🇺 **Русский:** Данная платформа разработана **специально для Республики Узбекистан** (телеметрия давления АГНКС Метан/Пропан, V2X «Зелёный коридор» экстренных служб 103/102/101/104/1050 и республиканская дорожная сеть). За пределами Узбекистана система может работать некорректно. Для корректной проверки и демонстрации всех функций **настоятельно рекомендуем включить GPS (геолокацию)** в браузере или тестировать маршруты внутри городов Узбекистана.
>
> * 🇬🇧 **English:** This platform is engineered **specifically for the Republic of Uzbekistan** (real-time CNG/LPG station telemetry, V2X Green Corridor for national 103/102/101/104/1050 emergency response, and localized road infrastructure). The system may not function as intended outside Uzbekistan. For the best evaluation experience, **we strongly recommend enabling GPS / location access** in your browser or selecting locations within Uzbekistan.

---

## 🌟 Key Competition Highlights & Innovations

1. **⛽ Real-Time Metan (CNG) & Propan (LPG) Smart Monitoring (Uzbekistan First):**
   - Live gas compressor pressure telemetry (`200+ Bar` green, `<180 Bar` warning), real-time queue length (`mashina navbati`), estimated wait time (`~daqiqa`), fuel prices, and open/closed status.
   - 1-click **"Eng qulay zapravkaga yo'l"** routing and Waze-style crowd-sourced status verification.

2. **🚨 V2X "Yashil Yo'lak" (Green Corridor) Acoustic & HUD Alert System:**
   - Automatic real-time alert for civilian drivers when an active emergency vehicle (**103, 102, 101, 104, 1050**) approaches within `500m` along their route.
   - Displays visual red HUD banner, directional lane-clearing instructions (*"Chap qatorni bo'shating"*), smart traffic light synchronization indicator, and Web Audio acoustic voice warning.

3. **🧭 Yandex Maps & Waze Grade Navigation Engine:**
   - **Live 1–10 Ball Traffic Index:** Real-time city congestion ball score and average city speed indicator.
   - **Multi-Modal Routing (A ➔ B):** Car, Public Transit, Bicycle, and Pedestrian routing with instant **Fastest (`Eng tez yo'l`)** vs. **Traffic Bypass (`Aylanma yo'l`)** route comparison.
   - **Corridor Hazard Intelligence:** Automatically detects all roadworks, closures, accidents, and traffic jams along the entire A-to-B path and fetches destination weather & European AQI.
   - **Interactive Map Controls:** 2D/3D perspective pitch (`55°`), compass reset, click-anywhere quick pinning, Waze 1-tap hazard reporting, and community verification (*"Hali ham shu yerdami? Ha / Yo'q"*).

4. **🚑 5-Service Municipal Emergency Dispatch Ecosystem (`#/ambulance`):**
   - Independent real-time dispatch, fleet management, and GPS turn-by-turn navigation for all 5 national emergency services:
     - **103:** Shoshilinch Tibbiy Yordam (Emergency Medical Ambulance)
     - **102:** Ichki Ishlar Organlari (Police & Traffic Patrol)
     - **101:** Yong'in Xavfsizligi (Fire & Rescue Service)
     - **104:** Favqulodda Gaz Avariya Xizmati (Emergency Gas Leak Response)
     - **1050:** FVV Maxsus Qutqaruv Xizmati (Ministry of Emergency Situations Rescue)
   - Live ETA calculation, route corridor hazard warnings, hospital/station capacity tracking, and automated **"Minutes Saved"** telemetry.

5. **🛡️ Multi-Role Workspaces & Strict RBAC Security:**
   - **Citizen:** Route planning, 1-tap hazard reporting, photo/video evidence upload, AI road assistant.
   - **Editor (Tahririyat):** Verification inbox, triage community reports, draft proposed map changes.
   - **Analyst (Tahlil):** Incident density heatmaps, verification rate metrics, CSV data export.
   - **Admin (Boshqaruv):** Transactional approval of map changes, 1-click feature rollback, full audit trail.
   - **Security:** JWT authentication, bcrypt password hashing, role-based least-privilege enforcement, rate limiting, Zod schema validation, and hardened HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

6. **♿ Accessibility & Tri-Lingual Support:**
   - High-contrast WCAG AAA mode, dark/night mode, and dynamic font scaling (`100%` to `140%`).
   - Full localization in **Uzbek (`uz`)**, **Russian (`ru`)**, and **English (`en`)**.

---

## 🔑 Demo Accounts (Competition Quick Access)

Click the **Kirish / Account** button on the top-right, or use the 1-click quick login cards inside the modal:

| Role | Email | Password | What to Demo to Judges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@yol.uz` | `Password123!` | Transactional Map Change approval, rollback, provider health, audit logs |
| **Editor** | `editor@yol.uz` | `Password123!` | Community report verification, propose hazards to live map |
| **Analyst** | `analyst@yol.uz` | `Password123!` | Mobility analytics, incident density heatmaps, CSV export |
| **Citizen** | `citizen@yol.uz` | `Password123!` | Route planning, incident reporting, Metan/Propan locator, AI assistant |
| **103 Dispatcher** | `dispatcher@103.uz` | `Password123!` | Live 103 incoming calls, hospital assignment, unit dispatch |
| **103 Driver** | `driver@103.uz` | `Password123!` | Turn-by-turn GPS route, corridor hazards, on-scene arrival |
| **102 / 101 / 104 / 1050 Staff** | `dispatcher@102.uz` / `driver@104.uz` etc. | `Password123!` | Service-specific emergency dispatch & crew navigation |

---

## 🚀 Quick Start

```powershell
# 1. Install dependencies & build all workspaces (@yol/shared, @yol/api, @yol/web)
npm install
npm run build

# 2. Run automated test suite (14/14 unit & integration tests)
npm test --workspace=@yol/api

# 3. Start development servers (Backend API on :4001 & Web UI on :3000)
npm run dev
```

- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **SOS Emergency Suite:** [http://localhost:3000/#/ambulance](http://localhost:3000/#/ambulance)
- **Backend API & OpenAPI Spec:** [http://localhost:4001/api/v1/openapi.json](http://localhost:4001/api/v1/openapi.json)
- **Health Check:** [http://localhost:4001/health](http://localhost:4001/health)

## Credits

   Behruzbek Marufjonov
   Anvar Sayfullaev
