import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  distance,
  bearing,
  destination,
  angleDifference,
  qiblaBearing,
  qiblaDistance,
  coordinateConversion,
  parseCoordinateString,
  formatDistance,
  KAABA_COORDS,
} from './GeoEngine.ts'

describe('GeoEngine — Distance, Bearing, Destination & Angle Difference', () => {
  it('computes shortest angleDifference across 0°/360° boundary', () => {
    assert.equal(angleDifference(359, 1), 2)
    assert.equal(angleDifference(1, 359), -2)
    assert.equal(angleDifference(350, 10), 20)
    assert.equal(angleDifference(10, 350), -20)
    assert.equal(angleDifference(90, 90), 0)
  })

  it('computes accurate great-circle distance between known coordinates', () => {
    // New Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) ~ 1,148 km
    const d = distance(
      { latitude: 28.6139, longitude: 77.2090 },
      { latitude: 19.0760, longitude: 72.8777 }
    )
    const km = d / 1000
    assert.ok(km > 1140 && km < 1156, `Expected ~1148 km, got ${km.toFixed(2)} km`)
  })

  it('computes accurate initial forward bearing in [0, 360)', () => {
    // Due North along meridian
    const north = bearing(
      { latitude: 10, longitude: 50 },
      { latitude: 20, longitude: 50 }
    )
    assert.ok(Math.abs(north - 0) < 1e-4)

    // Due East along Equator
    const east = bearing(
      { latitude: 0, longitude: 10 },
      { latitude: 0, longitude: 20 }
    )
    assert.ok(Math.abs(east - 90) < 1e-4)

    // Due South along meridian
    const south = bearing(
      { latitude: 20, longitude: 50 },
      { latitude: 10, longitude: 50 }
    )
    assert.ok(Math.abs(south - 180) < 1e-4)

    // Due West along Equator
    const west = bearing(
      { latitude: 0, longitude: 20 },
      { latitude: 0, longitude: 10 }
    )
    assert.ok(Math.abs(west - 270) < 1e-4)
  })

  it('computes destination point that round-trips with distance and bearing', () => {
    const start = { latitude: 28.6139, longitude: 77.2090 }
    const targetDist = 15000 // 15 km
    const targetBearing = 45 // NE
    const dest = destination(start, targetBearing, targetDist)

    const calcDist = distance(start, dest)
    const calcBearing = bearing(start, dest)

    assert.ok(Math.abs(calcDist - targetDist) < 1.0)
    assert.ok(Math.abs(angleDifference(calcBearing, targetBearing)) < 0.05)
  })
})

describe('GeoEngine — Qibla Bearing & Distance', () => {
  it('calculates known Qibla bearings for major reference cities', () => {
    // New Delhi -> Kaaba (~266.6° W)
    const qDelhi = qiblaBearing({ latitude: 28.6139, longitude: 77.2090 })
    assert.ok(Math.abs(qDelhi - 266.6) < 0.5, `New Delhi Qibla: ${qDelhi}`)

    // Cairo -> Kaaba (~136.2° SE)
    const qCairo = qiblaBearing({ latitude: 30.0444, longitude: 31.2357 })
    assert.ok(Math.abs(qCairo - 136.2) < 1.0, `Cairo Qibla: ${qCairo}`)

    // London -> Kaaba (~119.0° ESE)
    const qLondon = qiblaBearing({ latitude: 51.5074, longitude: -0.1278 })
    assert.ok(Math.abs(qLondon - 119.0) < 1.0, `London Qibla: ${qLondon}`)

    // Jakarta -> Kaaba (~295.1° WNW)
    const qJakarta = qiblaBearing({ latitude: -6.2088, longitude: 106.8456 })
    assert.ok(Math.abs(qJakarta - 295.1) < 1.0, `Jakarta Qibla: ${qJakarta}`)

    // Distance from Kaaba to itself is 0
    assert.equal(qiblaDistance(KAABA_COORDS), 0)
  })
})

describe('GeoEngine — Coordinate Conversion & Formatting', () => {
  it('converts Decimal Degrees to DMS and DM accurately', () => {
    const conv = coordinateConversion(28.6139, 77.209)
    assert.equal(conv.decimal.lat, '28.613900° N')
    assert.equal(conv.decimal.lon, '77.209000° E')
    assert.equal(conv.dms.lat, `28°36'50.04"N`)
    assert.equal(conv.dms.lon, `77°12'32.40"E`)
    assert.equal(conv.dm.lat, `28°36.834'N`)
    assert.equal(conv.dm.lon, `77°12.540'E`)
  })

  it('parses Decimal, DMS, and DM strings and validates bounds', () => {
    const dec = parseCoordinateString('28.6139° N', true)
    assert.ok(dec !== null && Math.abs(dec - 28.6139) < 1e-5)

    const dms = parseCoordinateString(`28°36'50.04"N`, true)
    assert.ok(dms !== null && Math.abs(dms - 28.6139) < 1e-4)

    const south = parseCoordinateString(`33°52'07.68"S`, true)
    assert.ok(south !== null && south < -33.86)

    // Invalid latitude > 90
    assert.equal(parseCoordinateString('95.5° N', true), null)
    // Invalid longitude > 180
    assert.equal(parseCoordinateString('195.0° E', false), null)
  })

  it('formats metric and imperial distances cleanly', () => {
    assert.equal(formatDistance(840, 'metric'), '840 m')
    assert.equal(formatDistance(1840, 'metric'), '1.84 km')
    assert.equal(formatDistance(1840, 'imperial'), '1.14 mi')
  })
})
