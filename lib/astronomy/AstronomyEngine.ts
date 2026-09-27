/**
 * Local Astronomical Calculation Engine for AXIS.
 * Zero external APIs. Implements NOAA / Jean Meeus Astronomical Algorithms
 * for solar azimuth, altitude, sunrise, solar noon, sunset, golden hour,
 * and lunar phase, illumination, azimuth, altitude, moonrise, and moonset.
 */

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI
const DAY_MS = 86400000
const J1970 = 2440587.5
const J2000 = 2451545.0

// Obliquity of the Earth
const OBLIQUITY = 23.4397 * DEG_TO_RAD

function toJulian(date: Date): number {
  return date.getTime() / DAY_MS + J1970
}

function fromJulian(j: number): Date {
  return new Date((j - J1970) * DAY_MS)
}

function toDays(date: Date): number {
  return toJulian(date) - J2000
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function rightAscension(l: number, b: number): number {
  return Math.atan2(
    Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY),
    Math.cos(l)
  )
}

function declination(l: number, b: number): number {
  return Math.asin(
    Math.sin(b) * Math.cos(OBLIQUITY) +
      Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l)
  )
}

/** Azimuth in radians measured from South; we convert to clockwise from North [0, 360) */
function azimuthFromNorth(H: number, phi: number, dec: number): number {
  const azFromSouth = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
  )
  return normalizeDeg(azFromSouth * RAD_TO_DEG + 180)
}

function altitudeAngle(H: number, phi: number, dec: number): number {
  return Math.asin(
    Math.max(
      -1,
      Math.min(
        1,
        Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)
      )
    )
  )
}

function siderealTime(d: number, lw: number): number {
  return (280.16 + 360.9856235 * d) * DEG_TO_RAD - lw
}

function astroRefraction(hRad: number): number {
  const h = hRad < 0 ? 0 : hRad
  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179))
}

/* ─── Solar Equations ─────────────────────────────────────────────── */

function solarMeanAnomaly(d: number): number {
  return (357.5291 + 0.98560028 * d) * DEG_TO_RAD
}

function eclipticLongitude(M: number): number {
  const C =
    (1.9148 * Math.sin(M) +
      0.02 * Math.sin(2 * M) +
      0.0003 * Math.sin(3 * M)) *
    DEG_TO_RAD
  const P = 102.9372 * DEG_TO_RAD // perihelion of the Earth
  return M + C + P + Math.PI
}

function sunCoords(d: number): { dec: number; ra: number } {
  const M = solarMeanAnomaly(d)
  const L = eclipticLongitude(M)
  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0),
  }
}

export interface SolarPosition {
  azimuth: number  // [0, 360) degrees clockwise from North
  altitude: number // [-90, 90] degrees above horizon
}

export function solarPosition(date: Date, lat: number, lon: number): SolarPosition {
  const lw = -lon * DEG_TO_RAD
  const phi = lat * DEG_TO_RAD
  const d = toDays(date)
  const c = sunCoords(d)
  const H = siderealTime(d, lw) - c.ra

  const hRaw = altitudeAngle(H, phi, c.dec)
  const hRefracted = hRaw + (hRaw > -0.01 ? astroRefraction(hRaw) : 0)

  return {
    azimuth: Math.round(azimuthFromNorth(H, phi, c.dec) * 10) / 10,
    altitude: Math.round(hRefracted * RAD_TO_DEG * 10) / 10,
  }
}

const J0 = 0.0009

function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * Math.PI))
}

function approxTransit(Ht: number, lw: number, n: number): number {
  return J0 + (Ht + lw) / (2 * Math.PI) + n
}

function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
}

function hourAngle(h: number, phi: number, d: number): number {
  const cosH = (Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d))
  if (cosH > 1 || cosH < -1) return Number.NaN
  return Math.acos(cosH)
}

function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number): number {
  const w = hourAngle(h, phi, dec)
  if (Number.isNaN(w)) return Number.NaN
  const a = approxTransit(w, lw, n)
  return solarTransitJ(a, M, L)
}

export interface SolarData {
  azimuth: number
  altitude: number
  sunrise: Date | null
  sunset: Date | null
  solarNoon: Date
  goldenHourEveningStart: Date | null
  goldenHourMorningEnd: Date | null
  daylightMinutes: number
  daylightRemainingMinutes: number
  isDaylight: boolean
}

export function getSolarData(date: Date, lat: number, lon: number): SolarData {
  const pos = solarPosition(date, lat, lon)
  const lw = -lon * DEG_TO_RAD
  const phi = lat * DEG_TO_RAD

  const d = toDays(date)
  const n = julianCycle(d, lw)
  const ds = approxTransit(0, lw, n)
  const M = solarMeanAnomaly(ds)
  const L = eclipticLongitude(M)
  const dec = declination(L, 0)

  const Jnoon = solarTransitJ(ds, M, L)
  const solarNoon = fromJulian(Jnoon)

  // Standard sunrise/sunset altitude = -0.833°
  const h0 = -0.833 * DEG_TO_RAD
  const Jset = getSetJ(h0, lw, phi, dec, n, M, L)
  const Jrise = Jnoon - (Jset - Jnoon)

  const sunrise = Number.isNaN(Jrise) ? null : fromJulian(Jrise)
  const sunset  = Number.isNaN(Jset)  ? null : fromJulian(Jset)

  // Golden hour top altitude = +6.0°
  const hGolden = 6.0 * DEG_TO_RAD
  const JgoldenSet = getSetJ(hGolden, lw, phi, dec, n, M, L)
  const JgoldenRise = Jnoon - (JgoldenSet - Jnoon)

  const goldenHourEveningStart = Number.isNaN(JgoldenSet)  ? null : fromJulian(JgoldenSet)
  const goldenHourMorningEnd   = Number.isNaN(JgoldenRise) ? null : fromJulian(JgoldenRise)

  let daylightMinutes = 0
  let daylightRemainingMinutes = 0
  if (sunrise && sunset) {
    daylightMinutes = Math.max(0, Math.round((sunset.getTime() - sunrise.getTime()) / 60000))
    if (date.getTime() >= sunrise.getTime() && date.getTime() <= sunset.getTime()) {
      daylightRemainingMinutes = Math.max(0, Math.round((sunset.getTime() - date.getTime()) / 60000))
    }
  } else if (pos.altitude > 0) {
    daylightMinutes = 1440
    daylightRemainingMinutes = 1440
  }

  return {
    azimuth: pos.azimuth,
    altitude: pos.altitude,
    sunrise,
    sunset,
    solarNoon,
    goldenHourEveningStart,
    goldenHourMorningEnd,
    daylightMinutes,
    daylightRemainingMinutes,
    isDaylight: pos.altitude > -0.833,
  }
}

/* ─── Lunar Equations ─────────────────────────────────────────────── */

function moonCoords(d: number): { ra: number; dec: number; dist: number } {
  const L = (218.316 + 13.176396 * d) * DEG_TO_RAD // ecliptic longitude
  const M = (134.963 + 13.064993 * d) * DEG_TO_RAD // mean anomaly
  const F = (93.272 + 13.229350 * d) * DEG_TO_RAD  // mean distance

  const l = L + 6.289 * DEG_TO_RAD * Math.sin(M)   // longitude
  const b = 5.128 * DEG_TO_RAD * Math.sin(F)       // latitude
  const dt = 385001 - 20905 * Math.cos(M)          // distance to the moon in km

  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: dt,
  }
}

export interface LunarPosition {
  azimuth: number
  altitude: number
  distanceKm: number
}

export function lunarPosition(date: Date, lat: number, lon: number): LunarPosition {
  const lw = -lon * DEG_TO_RAD
  const phi = lat * DEG_TO_RAD
  const d = toDays(date)
  const c = moonCoords(d)
  const H = siderealTime(d, lw) - c.ra
  let h = altitudeAngle(H, phi, c.dec)

  // Geocentric parallax correction for Moon
  const pa = Math.asin(6378.14 / c.dist)
  h = h - pa * Math.cos(h) + astroRefraction(h)

  return {
    azimuth: Math.round(azimuthFromNorth(H, phi, c.dec) * 10) / 10,
    altitude: Math.round(h * RAD_TO_DEG * 10) / 10,
    distanceKm: Math.round(c.dist),
  }
}

export type MoonPhaseName =
  | 'NEW MOON'
  | 'WAXING CRESCENT'
  | 'FIRST QUARTER'
  | 'WAXING GIBBOUS'
  | 'FULL MOON'
  | 'WANING GIBBOUS'
  | 'THIRD QUARTER'
  | 'WANING CRESCENT'

export interface MoonIllumination {
  fraction: number      // [0, 1] illuminated fraction
  percent: number       // [0, 100] percentage
  phase: number         // [0, 1) synodic cycle (0=New, 0.25=First Quarter, 0.5=Full, 0.75=Third Quarter)
  phaseName: MoonPhaseName
  angle: number         // midpoint angle of illuminated limb
}

export function moonPhase(date: Date): MoonIllumination {
  const d = toDays(date)
  const s = sunCoords(d)
  const m = moonCoords(d)
  const sdist = 149598000 // Earth-Sun distance km

  const phi = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        Math.sin(s.dec) * Math.sin(m.dec) +
          Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)
      )
    )
  )
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi))
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) -
      Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  )

  const fraction = (1 + Math.cos(inc)) / 2
  const phase = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI
  const normPhase = ((phase % 1) + 1) % 1

  let phaseName: MoonPhaseName = 'NEW MOON'
  if (normPhase < 0.03 || normPhase >= 0.97) phaseName = 'NEW MOON'
  else if (normPhase < 0.22) phaseName = 'WAXING CRESCENT'
  else if (normPhase < 0.28) phaseName = 'FIRST QUARTER'
  else if (normPhase < 0.47) phaseName = 'WAXING GIBBOUS'
  else if (normPhase < 0.53) phaseName = 'FULL MOON'
  else if (normPhase < 0.72) phaseName = 'WANING GIBBOUS'
  else if (normPhase < 0.78) phaseName = 'THIRD QUARTER'
  else phaseName = 'WANING CRESCENT'

  return {
    fraction,
    percent: Math.round(fraction * 100),
    phase: normPhase,
    phaseName,
    angle,
  }
}

function hoursLater(date: Date, h: number): Date {
  return new Date(date.getTime() + h * 3600000)
}

export interface LunarData extends LunarPosition, MoonIllumination {
  moonrise: Date | null
  moonset: Date | null
}

/**
 * Computes complete lunar data including rise/set times via quadratic interpolation across 24h.
 */
export function getLunarData(date: Date, lat: number, lon: number): LunarData {
  const pos = lunarPosition(date, lat, lon)
  const illum = moonPhase(date)

  const t0 = new Date(date)
  t0.setHours(0, 0, 0, 0)

  const hc = 0.133 * DEG_TO_RAD
  let h0 = lunarPosition(t0, lat, lon).altitude * DEG_TO_RAD - hc
  let rise: number | null = null
  let set: number | null = null

  for (let i = 1; i <= 24; i += 2) {
    const h1 = lunarPosition(hoursLater(t0, i), lat, lon).altitude * DEG_TO_RAD - hc
    const h2 = lunarPosition(hoursLater(t0, i + 1), lat, lon).altitude * DEG_TO_RAD - hc

    const a = (h0 + h2) / 2 - h1
    const b = (h2 - h0) / 2
    const xe = -b / (2 * a)
    const ye = (a * xe + b) * xe + h1
    const d = b * b - 4 * a * h1

    if (d >= 0) {
      const dx = Math.sqrt(d) / (Math.abs(a) * 2)
      let x1 = xe - dx
      const x2 = xe + dx
      let roots = 0
      if (Math.abs(x1) <= 1) roots++
      if (Math.abs(x2) <= 1) roots++
      if (x1 < -1) x1 = x2

      if (roots === 1) {
        if (h0 < 0) rise = i + x1
        else set = i + x1
      } else if (roots === 2) {
        rise = i + (ye < 0 ? x2 : x1)
        set = i + (ye < 0 ? x1 : x2)
      }
    }

    if (rise !== null && set !== null) break
    h0 = h2
  }

  return {
    ...pos,
    ...illum,
    moonrise: rise !== null ? hoursLater(t0, rise) : null,
    moonset: set !== null ? hoursLater(t0, set) : null,
  }
}

export function formatTimeHHMM(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDurationHM(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0h 00m'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export const AstronomyEngine = {
  solarPosition,
  getSolarData,
  lunarPosition,
  moonPhase,
  getLunarData,
  formatTimeHHMM,
  formatDurationHM,
}
