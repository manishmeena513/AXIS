import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  solarPosition,
  getSolarData,
  lunarPosition,
  moonPhase,
  getLunarData,
} from './AstronomyEngine.ts'

describe('AstronomyEngine — Solar Calculations', () => {
  it('computes solar position with valid azimuth [0, 360) and altitude [-90, 90]', () => {
    const date = new Date('2026-06-21T06:45:00Z') // near solar noon in India (UTC+5:30 = 12:15 IST)
    const pos = solarPosition(date, 28.6139, 77.2090)

    assert.ok(pos.azimuth >= 0 && pos.azimuth < 360)
    assert.ok(pos.altitude > 75 && pos.altitude <= 90, `Expected high summer solstice altitude in Delhi, got ${pos.altitude}°`)
  })

  it('computes sunrise < solarNoon < sunset and ~12h daylight on equinox', () => {
    const date = new Date('2026-03-20T12:00:00Z') // March equinox
    const data = getSolarData(date, 28.6139, 77.2090)

    assert.ok(data.sunrise instanceof Date)
    assert.ok(data.sunset instanceof Date)
    assert.ok(data.solarNoon instanceof Date)
    assert.ok(data.sunrise.getTime() < data.solarNoon.getTime())
    assert.ok(data.solarNoon.getTime() < data.sunset.getTime())
    assert.ok(data.daylightMinutes >= 710 && data.daylightMinutes <= 740, `Expected ~725 min daylight on equinox, got ${data.daylightMinutes}`)
  })

  it('computes morning and evening golden hour timestamps', () => {
    const date = new Date('2026-09-27T12:00:00Z')
    const data = getSolarData(date, 28.6139, 77.2090)

    assert.ok(data.goldenHourMorningEnd instanceof Date)
    assert.ok(data.goldenHourEveningStart instanceof Date)
    assert.ok(data.goldenHourMorningEnd.getTime() > data.sunrise!.getTime())
    assert.ok(data.goldenHourEveningStart.getTime() < data.sunset!.getTime())
  })
})

describe('AstronomyEngine — Lunar Phase, Illumination & Position', () => {
  it('identifies a known Full Moon with >97% illumination', () => {
    // Known Full Moon: 2025-01-13T22:27:00Z
    const fullMoonDate = new Date('2025-01-13T22:27:00Z')
    const illum = moonPhase(fullMoonDate)

    assert.ok(illum.percent >= 97, `Expected >=97% illumination at Full Moon, got ${illum.percent}%`)
    assert.equal(illum.phaseName, 'FULL MOON')
  })

  it('identifies a known New Moon with <=3% illumination', () => {
    // Known New Moon: 2025-01-29T12:36:00Z
    const newMoonDate = new Date('2025-01-29T12:36:00Z')
    const illum = moonPhase(newMoonDate)

    assert.ok(illum.percent <= 3, `Expected <=3% illumination at New Moon, got ${illum.percent}%`)
    assert.equal(illum.phaseName, 'NEW MOON')
  })

  it('computes valid lunar azimuth, altitude, and rise/set data', () => {
    const date = new Date('2026-09-27T18:00:00Z')
    const lunar = getLunarData(date, 28.6139, 77.2090)

    assert.ok(lunar.azimuth >= 0 && lunar.azimuth < 360)
    assert.ok(lunar.altitude >= -90 && lunar.altitude <= 90)
    assert.ok(lunar.distanceKm > 350000 && lunar.distanceKm < 410000)
    assert.ok(lunar.percent >= 0 && lunar.percent <= 100)
  })
})
