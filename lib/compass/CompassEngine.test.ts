import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getMagneticDeclination } from './magneticDeclination.ts'
import { CalibrationManager } from '../sensors/CalibrationManager.ts'

// Pure circular math functions matching CompassEngine
function shortestAngularDiff(from: number, to: number): number {
  let diff = to - from
  while (diff > 180)  diff -= 360
  while (diff < -180) diff += 360
  return diff
}

function circularLerp(from: number, to: number, alpha: number): number {
  const diff = shortestAngularDiff(from, to)
  return ((from + diff * alpha) % 360 + 360) % 360
}

function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360
}

describe('CompassEngine Circular Math & Heading Pipeline', () => {
  it('normalizes headings into [0, 360)', () => {
    assert.equal(normalizeHeading(0), 0)
    assert.equal(normalizeHeading(360), 0)
    assert.equal(normalizeHeading(725), 5)
    assert.equal(normalizeHeading(-10), 350)
    assert.equal(normalizeHeading(-360), 0)
  })

  it('computes shortest angular difference across 359° -> 0° boundary', () => {
    assert.equal(shortestAngularDiff(359, 1), 2)
    assert.equal(shortestAngularDiff(1, 359), -2)
    assert.equal(shortestAngularDiff(350, 10), 20)
    assert.equal(shortestAngularDiff(90, 270), 180)
  })

  it('interpolates 359° -> 1° via 0° instead of backward through 180°', () => {
    const mid = circularLerp(359, 1, 0.5)
    assert.ok(Math.abs(mid - 0) < 1e-6 || Math.abs(mid - 360) < 1e-6)

    const quarter = circularLerp(350, 10, 0.25)
    assert.ok(Math.abs(quarter - 355) < 1e-6)

    const reverse = circularLerp(5, 355, 0.5)
    assert.ok(Math.abs(reverse - 0) < 1e-6 || Math.abs(reverse - 360) < 1e-6)
  })

  it('calculates local magnetic declination without network APIs', () => {
    // New Delhi (28.6139° N, 77.2090° E)
    const declDelhi = getMagneticDeclination(28.6139, 77.209)
    assert.ok(Number.isFinite(declDelhi))
    assert.ok(declDelhi > -25 && declDelhi < 25)

    // New York (40.7128° N, -74.0060° W)
    const declNY = getMagneticDeclination(40.7128, -74.006)
    assert.ok(Number.isFinite(declNY))
  })
})

describe('CalibrationManager', () => {
  it('tracks figure-eight calibration progress across compass octants', () => {
    const cal = new CalibrationManager()
    assert.equal(cal.calibrationProgress, 0)

    const octantHeadings = [10, 55, 100, 145, 190, 235, 280, 325]
    for (const h of octantHeadings) {
      cal.update(h)
    }
    assert.equal(cal.calibrationProgress, 100)
  })

  it('supports manual completion and reset', () => {
    const cal = new CalibrationManager()
    cal.update(15)
    assert.ok(cal.calibrationProgress > 0 && cal.calibrationProgress < 100)

    cal.markCalibrated()
    assert.equal(cal.calibrationProgress, 100)

    cal.reset()
    assert.equal(cal.calibrationProgress, 0)
  })
})
