/**
 * Local Geographic Calculation Engine for AXIS.
 * Zero external APIs. Uses WGS-84 mean spherical radius (6,371,008.8 m)
 * and exact great-circle spherical trigonometry.
 */

export interface GeoPoint {
  latitude: number
  longitude: number
}

export const EARTH_RADIUS_M = 6371008.8

/** Fixed geographic coordinates of the Kaaba in Makkah */
export const KAABA_COORDS: GeoPoint = {
  latitude: 21.422487,
  longitude: 39.826206,
}

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

export function toRad(deg: number): number {
  return deg * DEG_TO_RAD
}

export function toDeg(rad: number): number {
  return rad * RAD_TO_DEG
}

/** Normalize angle into [0, 360) */
export function normalizeAngle(deg: number): number {
  const mod = ((deg % 360) + 360) % 360
  return mod === 360 ? 0 : mod
}

/**
 * Shortest signed turn angle from `fromDeg` to `toDeg` in [-180, +180].
 * Positive = turn right (clockwise), Negative = turn left (counter-clockwise).
 * Examples:
 *   angleDifference(359, 1) -> +2
 *   angleDifference(1, 359) -> -2
 */
export function angleDifference(fromDeg: number, toDeg: number): number {
  let diff = ((toDeg - fromDeg) % 360 + 360) % 360
  if (diff > 180) diff -= 360
  return Object.is(diff, -0) ? 0 : diff
}

/**
 * Great-circle Haversine distance between two coordinates in meters.
 */
export function distance(pointA: GeoPoint, pointB: GeoPoint): number {
  const lat1 = toRad(pointA.latitude)
  const lat2 = toRad(pointB.latitude)
  const dLat = toRad(pointB.latitude - pointA.latitude)
  const dLon = toRad(pointB.longitude - pointA.longitude)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)

  const a =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)))

  return EARTH_RADIUS_M * c
}

/**
 * Initial forward great-circle bearing from `pointA` to `pointB` in [0, 360).
 */
export function bearing(pointA: GeoPoint, pointB: GeoPoint): number {
  const lat1 = toRad(pointA.latitude)
  const lat2 = toRad(pointB.latitude)
  const dLon = toRad(pointB.longitude - pointA.longitude)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) return 0
  const theta = Math.atan2(y, x)
  return normalizeAngle(toDeg(theta))
}

/**
 * Destination point given start point, initial bearing (degrees), and distance (meters).
 */
export function destination(
  origin: GeoPoint,
  bearingDeg: number,
  distanceMeters: number
): GeoPoint {
  const angularDist = distanceMeters / EARTH_RADIUS_M
  const brng = toRad(bearingDeg)
  const lat1 = toRad(origin.latitude)
  const lon1 = toRad(origin.longitude)

  const sinLat1 = Math.sin(lat1)
  const cosLat1 = Math.cos(lat1)
  const sinD = Math.sin(angularDist)
  const cosD = Math.cos(angularDist)

  const sinLat2 = sinLat1 * cosD + cosLat1 * sinD * Math.cos(brng)
  const lat2 = Math.asin(Math.max(-1, Math.min(1, sinLat2)))
  const y = Math.sin(brng) * sinD * cosLat1
  const x = cosD - sinLat1 * sinLat2
  const lon2 = lon1 + Math.atan2(y, x)

  // Normalize longitude to [-180, +180]
  const normLon = ((((toDeg(lon2) + 180) % 360) + 360) % 360) - 180

  return {
    latitude: toDeg(lat2),
    longitude: normLon,
  }
}

/**
 * Great-circle Qibla bearing from `origin` to the Kaaba in Makkah [0, 360).
 */
export function qiblaBearing(origin: GeoPoint): number {
  return bearing(origin, KAABA_COORDS)
}

/**
 * Great-circle distance in meters from `origin` to the Kaaba in Makkah.
 */
export function qiblaDistance(origin: GeoPoint): number {
  return distance(origin, KAABA_COORDS)
}

export function isValidLatitude(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
}

export function isValidLongitude(lon: number): boolean {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180
}

export function isValidCoordinates(lat: number, lon: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lon)
}

/**
 * Format single coordinate in Decimal Degrees (e.g., `28.613900° N`).
 */
export function formatDecimalCoord(value: number, isLat: boolean, decimals = 6): string {
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W'
  return `${Math.abs(value).toFixed(decimals)}° ${dir}`
}

/**
 * Format single coordinate in Degrees Minutes Seconds (e.g., `28°36'50.04"N`).
 */
export function formatDMSCoord(value: number, isLat: boolean): string {
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W'
  const abs = Math.abs(value)
  let deg = Math.floor(abs)
  const minFull = (abs - deg) * 60
  let min = Math.floor(minFull)
  let sec = (minFull - min) * 60

  // Handle rounding rollover (e.g., 59.999 -> 60.00)
  if (Number(sec.toFixed(2)) >= 60) {
    sec = 0
    min += 1
  }
  if (min >= 60) {
    min = 0
    deg += 1
  }

  const minPad = String(min).padStart(2, '0')
  const secPad = sec.toFixed(2).padStart(5, '0')
  return `${deg}°${minPad}'${secPad}"${dir}`
}

/**
 * Format single coordinate in Degrees Decimal Minutes (e.g., `28°36.834'N`).
 */
export function formatDMCoord(value: number, isLat: boolean): string {
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W'
  const abs = Math.abs(value)
  let deg = Math.floor(abs)
  let min = (abs - deg) * 60

  if (Number(min.toFixed(3)) >= 60) {
    min = 0
    deg += 1
  }

  const minStr = min.toFixed(3).padStart(6, '0')
  return `${deg}°${minStr}'${dir}`
}

export interface ConvertedCoordinates {
  decimal: { lat: string; lon: string; full: string }
  dms:     { lat: string; lon: string; full: string }
  dm:      { lat: string; lon: string; full: string }
}

/**
 * Convert a (latitude, longitude) pair into Decimal, DMS, and DM formats.
 */
export function coordinateConversion(lat: number, lon: number): ConvertedCoordinates {
  const decLat = formatDecimalCoord(lat, true, 6)
  const decLon = formatDecimalCoord(lon, false, 6)
  const dmsLat = formatDMSCoord(lat, true)
  const dmsLon = formatDMSCoord(lon, false)
  const dmLat  = formatDMCoord(lat, true)
  const dmLon  = formatDMCoord(lon, false)

  return {
    decimal: { lat: decLat, lon: decLon, full: `${decLat}, ${decLon}` },
    dms:     { lat: dmsLat, lon: dmsLon, full: `${dmsLat} ${dmsLon}` },
    dm:      { lat: dmLat,  lon: dmLon,  full: `${dmLat} ${dmLon}` },
  }
}

/**
 * Parse a user-entered coordinate string (Decimal, DMS, or DM) into a signed decimal degree number.
 * Returns `null` if invalid.
 */
export function parseCoordinateString(input: string, isLat: boolean): number | null {
  const raw = input.trim().toUpperCase()
  if (!raw) return null

  const signMatch = raw.match(/[NSWEX+-]/g)
  let hemisphereSign = 1
  if (raw.includes('S') || raw.includes('W') || raw.startsWith('-')) {
    hemisphereSign = -1
  }
  if (isLat && (raw.includes('E') || raw.includes('W'))) return null
  if (!isLat && (raw.includes('N') || raw.includes('S'))) return null
  void signMatch

  // Extract numeric parts (up to 3 parts: deg, min, sec)
  const cleaned = raw.replace(/[NSEW°'"′″+-]/g, ' ').trim()
  const parts = cleaned.split(/[\s:]+/).filter(Boolean)
  if (parts.length === 0 || parts.length > 3) return null

  const nums = parts.map(Number)
  if (nums.some(n => !Number.isFinite(n) || n < 0)) return null

  const deg = nums[0]
  const min = nums[1] ?? 0
  const sec = nums[2] ?? 0

  if (min >= 60 || sec >= 60) return null

  const val = (deg + min / 60 + sec / 3600) * hemisphereSign
  if (isLat && !isValidLatitude(val)) return null
  if (!isLat && !isValidLongitude(val)) return null
  return val
}

/**
 * Sensible automatic distance formatting for Metric (m / km) and Imperial (ft / mi).
 */
export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (!Number.isFinite(meters) || meters < 0) return '—'
  if (units === 'imperial') {
    const feet = meters * 3.280839895
    if (feet < 1000) {
      return `${Math.round(feet)} ft`
    }
    const miles = meters / 1609.344
    return miles >= 100 ? `${Math.round(miles)} mi` : `${miles.toFixed(2)} mi`
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  const km = meters / 1000
  return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(2)} km`
}

export function formatAltitude(meters: number | null, units: 'metric' | 'imperial' = 'metric'): string {
  if (meters === null || !Number.isFinite(meters)) return '—'
  if (units === 'imperial') {
    return `${Math.round(meters * 3.280839895)} ft`
  }
  return `${Math.round(meters)} m`
}

export function formatSpeed(metersPerSec: number | null, units: 'metric' | 'imperial' = 'metric'): string {
  if (metersPerSec === null || !Number.isFinite(metersPerSec) || metersPerSec < 0) return '0.0 km/h'
  if (units === 'imperial') {
    return `${(metersPerSec * 2.23693629).toFixed(1)} mph`
  }
  return `${(metersPerSec * 3.6).toFixed(1)} km/h`
}

export const GeoEngine = {
  distance,
  bearing,
  destination,
  angleDifference,
  normalizeAngle,
  qiblaBearing,
  qiblaDistance,
  coordinateConversion,
  parseCoordinateString,
  isValidCoordinates,
  formatDistance,
  formatAltitude,
  formatSpeed,
}
