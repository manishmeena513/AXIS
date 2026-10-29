# AXIS — 3D Compass & Offline Navigation Utility

> **High-precision digital compass, sensor telemetry, and navigational instruments for the modern web.**  
> Built with Next.js 16, React 19, Three.js, and client-side device sensor APIs.

🔗 **Live Application:** [https://axis-lac-pi.vercel.app](https://axis-lac-pi.vercel.app)

---

## Overview

**AXIS** is a modern navigation workstation and sensor instrument. Designed for explorers, surveyors, photographers, and outdoor enthusiasts, AXIS turns any smartphone or web browser into an orientation and positioning instrument.

All sensor telemetry, bearing mathematics, coordinate projections, and astronomical ephemeris models execute **directly on-device** using client-side Web APIs, WebGL, and local browser storage.

---

## Features & Instrumentation

### 🧭 3D Compass & Heading (`/`)
- **WebGL 3D Dial:** Smooth 60fps rotational compass card rendered with Three.js via `@react-three/fiber` and `@react-three/drei`.
- **Magnetic vs. True North:** Toggle between Magnetic North and True North with calculated local magnetic declination (`lib/compass/magneticDeclination.ts`).
- **Sensor Fusion:** Continuous device heading, roll, and pitch tracking via `DeviceOrientationEvent` with calibration confidence checks.

### 📍 Location & GPS Telemetry (`/location`)
- **Coordinates:** Real-time Latitude and Longitude in Decimal Degrees (DD) and Degrees-Minutes-Seconds (DMS).
- **Altitude & Accuracy:** Current GPS elevation and circular accuracy bounds.
- **Motion:** Speed and ground course tracking.

### 🌐 Coordinate Conversion (`/tools/coordinates`)
Two-way conversion across four standard global coordinate systems powered by `lib/geo/GeoEngine.ts`:
- **DD** (Decimal Degrees)
- **DMS** (Degrees, Minutes, Seconds)
- **UTM** (Universal Transverse Mercator)
- **MGRS** (Military Grid Reference System)

### 📐 Bearing & Distance (`/tools/bearing`)
- Forward azimuth, reverse bearing, and great-circle distance (Haversine formula) between coordinates.

### ☀️ Solar & Lunar Ephemeris (`/tools/sun` & `/tools/moon`)
- **Sun Tracker:** Real-time solar azimuth, elevation, sunrise, solar noon, sunset, and photography golden/blue hour windows via `lib/astronomy/AstronomyEngine.ts`.
- **Moon Tracker:** Current lunar phase, illumination percentage, moonrise, and moonset times.

### ⚖️ Digital Spirit Level (`/tools/level`)
- Dual-axis bubble inclinometer utilizing accelerometer telemetry to measure surface pitch and roll in degrees with zero-calibration support.

### 🕋 Qibla Finder (`/tools/qibla`)
- Great-circle navigation bearing and distance to the Kaaba in Mecca from current device coordinates.

### 📌 Local Waypoints
- Create, label, and inspect custom field waypoints stored locally in IndexedDB via `idb` (`lib/storage/waypointStore.ts`).
- Real-time bearing and distance tracking to saved waypoints without network dependence.

### ⚙️ Preferences & Feedback Engine (`/settings`)
- **Units:** Metric (`m`, `km/h`), Imperial (`ft`, `mph`), Nautical (`nm`, `knots`).
- **Haptics & Audio:** Tactile vibration pulses (`navigator.vibrate`) and Web Audio clicks on degree thresholds.
- **Battery Profile:** Configurable sensor update frequencies for power preservation.

---

## Offline & PWA Behavior

- **PWA Installation:** Installable as a standalone app on iOS, Android, macOS, and Windows via Web App Manifest and Service Worker (`@ducanh2912/next-pwa`).
- **Offline Capabilities:** All mathematical calculations, sensor tracking, compass rendering, astronomical ephemeris, and waypoint storage function entirely offline once cached. *(Note: Map tile rendering or external reverse-geocoding requests require an active connection if tiles are not pre-cached).*

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16.3.6 (App Router), React 19.2.8 |
| **3D Rendering** | Three.js (`three`), `@react-three/fiber`, `@react-three/drei` |
| **Animation & Motion** | Framer Motion |
| **Styling** | Tailwind CSS v4 |
| **Persistence** | IndexedDB (`idb`), `localStorage` |
| **Offline / PWA** | `@ducanh2912/next-pwa`, Service Workers |
| **Language** | TypeScript 5.x |

---

## Getting Started Locally

### Prerequisites
- Node.js `20.x` or higher
- npm

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/manishmeena513/AXIS.git
cd AXIS

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.  
*(Testing on a mobile device or tablet is recommended to access physical magnetometer and gyroscope sensors).*

### Available Scripts

- `npm run dev` — Starts local development server with Turbopack.
- `npm run build` — Compiles the Next.js production build.
- `npm run start` — Runs the compiled production server.
- `npm run lint` — Runs ESLint checks.

---

## Device & Browser Permissions

To utilize hardware instrumentation:
- **Location:** Requires browser Geolocation permission.
- **Orientation:** On iOS 13+ devices, Safari requires an explicit user gesture to grant `DeviceOrientation` permission.
- **Desktop Fallback:** On devices without a hardware magnetometer/gyroscope, manual control handles and simulation fallbacks allow testing of navigation features.

---

## Deployment

AXIS is deployed on **Vercel**:
- Production URL: [https://axis-lac-pi.vercel.app](https://axis-lac-pi.vercel.app)
- Build Command: `next build`

---

## Maintainer & Copyright

Maintained by [Manish Meena](https://github.com/manishmeena513). All rights reserved.
