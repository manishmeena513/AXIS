import type { SensorAccuracy, MotionReading } from './types'

const WINDOW_SIZE = 24
const POOR_STD    = 8.0
const FAIR_STD    = 3.0
const INTERFERENCE_JUMP_DEG = 28.0

function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0
  const sinSum = angles.reduce((s, a) => s + Math.sin((a * Math.PI) / 180), 0)
  const cosSum = angles.reduce((s, a) => s + Math.cos((a * Math.PI) / 180), 0)
  return ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360
}

function circularStd(angles: number[], mean: number): number {
  if (angles.length < 2) return 0
  const diffs = angles.map(a => {
    let d = a - mean
    while (d > 180)  d -= 360
    while (d < -180) d += 360
    return d * d
  })
  return Math.sqrt(diffs.reduce((s, d) => s + d, 0) / angles.length)
}

function shortestDiff(a: number, b: number): number {
  let d = b - a
  while (d > 180)  d -= 360
  while (d < -180) d += 360
  return Math.abs(d)
}

export class CalibrationManager {
  private window: number[] = []
  private listeners: Set<(acc: SensorAccuracy) => void> = new Set()
  private _accuracy: SensorAccuracy = 'unavailable'
  private _magneticInterference = false
  private lastHeading: number | null = null
  private lastRotationRate = 0
  private visitedOctants: Set<number> = new Set()
  private _calibrationProgress = 0

  updateMotion(motion: MotionReading): void {
    const rAlpha = motion.rotationRateAlpha ?? 0
    const rBeta  = motion.rotationRateBeta  ?? 0
    const rGamma = motion.rotationRateGamma ?? 0
    this.lastRotationRate = Math.sqrt(rAlpha * rAlpha + rBeta * rBeta + rGamma * rGamma)
  }

  update(heading: number): SensorAccuracy {
    // Track octants visited for figure-eight calibration progress
    const octant = Math.floor(((heading % 360) + 360) % 360 / 45)
    this.visitedOctants.add(octant)
    this._calibrationProgress = Math.min(100, Math.round((this.visitedOctants.size / 8) * 100))

    // Detect sudden heading jump when phone is not rotating fast -> magnetic interference
    if (this.lastHeading !== null) {
      const jump = shortestDiff(this.lastHeading, heading)
      if (jump > INTERFERENCE_JUMP_DEG && this.lastRotationRate < 45) {
        this._magneticInterference = true
      }
    }
    this.lastHeading = heading

    this.window.push(heading)
    if (this.window.length > WINDOW_SIZE) this.window.shift()

    if (this.window.length < 5) {
      this._accuracy = 'fair'
    } else {
      const mean = circularMean(this.window)
      const std  = circularStd(this.window, mean)
      if (std > POOR_STD) {
        this._accuracy = 'poor'
        if (this.lastRotationRate < 25) {
          this._magneticInterference = true
        }
      } else if (std > FAIR_STD) {
        this._accuracy = 'fair'
      } else {
        this._accuracy = 'good'
        this._magneticInterference = false
      }
    }

    this.listeners.forEach(fn => fn(this._accuracy))
    return this._accuracy
  }

  markCalibrated(): void {
    this.window = []
    this._accuracy = 'good'
    this._magneticInterference = false
    this._calibrationProgress = 100
    this.listeners.forEach(fn => fn(this._accuracy))
  }

  get accuracy(): SensorAccuracy {
    return this._accuracy
  }

  get magneticInterference(): boolean {
    return this._magneticInterference
  }

  get calibrationProgress(): number {
    return this._calibrationProgress
  }

  subscribe(fn: (acc: SensorAccuracy) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  reset(): void {
    this.window = []
    this.visitedOctants.clear()
    this._calibrationProgress = 0
    this._accuracy = 'unavailable'
    this._magneticInterference = false
  }
}
