import { SensorManager } from '@/lib/sensors/SensorManager'
import { getMagneticDeclination } from './magneticDeclination'
import type { SensorAccuracy, PermissionStatus } from '@/lib/sensors/types'

/** Shortest signed angular difference in [-180, 180] */
export function shortestAngularDiff(from: number, to: number): number {
  let diff = to - from
  while (diff > 180)  diff -= 360
  while (diff < -180) diff += 360
  return diff
}

/** Circular shortest-arc interpolation */
export function circularLerp(from: number, to: number, alpha: number): number {
  const diff = shortestAngularDiff(from, to)
  return ((from + diff * alpha) % 360 + 360) % 360
}

/** Normalize heading to [0, 360) */
export function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360
}

export interface CompassState {
  heading:              number           // smoothed, normalized [0, 360)
  rawHeading:           number           // direct sensor reading
  tiltX:                number           // pitch (beta - offset)
  tiltY:                number           // roll (gamma - offset)
  accuracy:             SensorAccuracy
  magneticInterference: boolean
  calibrationProgress:  number
  permissionStatus:     PermissionStatus
  sensorAvailable:      boolean
  northMode:            'magnetic' | 'true'
  lockedHeading:        number | null
  isRunning:            boolean
  declination:          number
  hasLocation:          boolean
  isSimulated:          boolean
}

type CompassListener = (state: CompassState) => void

class CompassEngineClass {
  private _state: CompassState = {
    heading:              0,
    rawHeading:           0,
    tiltX:                0,
    tiltY:                0,
    accuracy:             'unavailable',
    magneticInterference: false,
    calibrationProgress:  0,
    permissionStatus:     'prompt',
    sensorAvailable:      true,
    northMode:            'magnetic',
    lockedHeading:        null,
    isRunning:            false,
    declination:          0,
    hasLocation:          false,
    isSimulated:          false,
  }

  private smoothed       = 0
  private listeners: Set<CompassListener> = new Set()
  private unsubSensor: (() => void) | null = null
  private smoothingAlpha = 0.14
  private lastRaw: number | null = null
  private tiltOffsetX    = 0
  private tiltOffsetY    = 0
  private lastRawTiltX   = 0
  private lastRawTiltY   = 0

  start(): void {
    if (this._state.isRunning) return

    this.unsubSensor = SensorManager.subscribe(sensorState => {
      const reading = sensorState.orientation

      // Always sync availability & permission states even before first orientation reading
      if (!reading || reading.alpha === null) {
        this.updateState({
          accuracy:             sensorState.accuracy,
          permissionStatus:     sensorState.permissionStatus,
          sensorAvailable:      sensorState.sensorAvailable,
          magneticInterference: sensorState.magneticInterference,
          calibrationProgress:  sensorState.calibrationProgress,
        })
        return
      }

      const raw = normalizeHeading(reading.alpha)
      this.lastRawTiltX = reading.beta  ?? 0
      this.lastRawTiltY = reading.gamma ?? 0

      // Jitter gate: ignore sub-threshold micro-noise (< 0.1°)
      if (this.lastRaw !== null && Math.abs(shortestAngularDiff(this.lastRaw, raw)) < 0.1) {
        // Still allow tilt updates
        this.updateState({
          tiltX:                Math.max(-45, Math.min(45, this.lastRawTiltX - this.tiltOffsetX)),
          tiltY:                Math.max(-45, Math.min(45, this.lastRawTiltY - this.tiltOffsetY)),
          accuracy:             sensorState.accuracy,
          magneticInterference: sensorState.magneticInterference,
          calibrationProgress:  sensorState.calibrationProgress,
          permissionStatus:     sensorState.permissionStatus,
          sensorAvailable:      true,
          isSimulated:          false,
        })
        return
      }
      this.lastRaw = raw

      // Apply magnetic declination if true-north mode
      let adjusted = raw
      if (this._state.northMode === 'true') {
        adjusted = normalizeHeading(raw + this._state.declination)
      }

      // Circular EMA smoothing
      this.smoothed = circularLerp(this.smoothed, adjusted, this.smoothingAlpha)

      this.updateState({
        rawHeading:           raw,
        heading:              normalizeHeading(Math.round(this.smoothed * 10) / 10),
        tiltX:                Math.max(-45, Math.min(45, this.lastRawTiltX - this.tiltOffsetX)),
        tiltY:                Math.max(-45, Math.min(45, this.lastRawTiltY - this.tiltOffsetY)),
        accuracy:             sensorState.accuracy,
        magneticInterference: sensorState.magneticInterference,
        calibrationProgress:  sensorState.calibrationProgress,
        permissionStatus:     sensorState.permissionStatus,
        sensorAvailable:      true,
        isSimulated:          false,
      })
    })

    SensorManager.start()
    this.updateState({ isRunning: true })
  }

  stop(): void {
    this.unsubSensor?.()
    this.unsubSensor = null
    SensorManager.stop()
    this.updateState({ isRunning: false })
  }

  setNorthMode(mode: 'magnetic' | 'true'): void {
    const raw = this._state.rawHeading
    const adjusted = mode === 'true'
      ? normalizeHeading(raw + this._state.declination)
      : raw
    this.smoothed = adjusted
    this.updateState({
      northMode: mode,
      heading: normalizeHeading(Math.round(adjusted * 10) / 10),
    })
  }

  setLocation(lat: number, lon: number): void {
    const decl = getMagneticDeclination(lat, lon)
    this.updateState({ declination: decl, hasLocation: true })
  }

  lockHeading(heading?: number): void {
    this.updateState({ lockedHeading: heading ?? this._state.heading })
  }

  unlockHeading(): void {
    this.updateState({ lockedHeading: null })
  }

  /** Reset visual tilt/parallax to current device hold angle (Double-tap gesture) */
  resetTilt(): void {
    this.tiltOffsetX = this.lastRawTiltX
    this.tiltOffsetY = this.lastRawTiltY
    this.updateState({ tiltX: 0, tiltY: 0 })
  }

  /** Used on desktop when hardware sensors are absent so users can still interact with the 3D instrument */
  setSimulatedHeading(heading: number, tiltX = 0, tiltY = 0): void {
    const norm = normalizeHeading(heading)
    const adjusted = this._state.northMode === 'true'
      ? normalizeHeading(norm + this._state.declination)
      : norm
    this.smoothed = adjusted
    this.updateState({
      rawHeading:  norm,
      heading:     normalizeHeading(Math.round(adjusted * 10) / 10),
      tiltX,
      tiltY,
      isSimulated: true,
    })
  }

  markCalibrated(): void {
    SensorManager.markCalibrated()
  }

  setBatteryMode(mode: 'performance' | 'balanced' | 'saver'): void {
    SensorManager.setBatteryMode(mode)
    const alphas = { performance: 0.18, balanced: 0.12, saver: 0.08 }
    this.smoothingAlpha = alphas[mode]
  }

  setSmoothingAlpha(alpha: number): void {
    this.smoothingAlpha = Math.max(0.02, Math.min(0.3, alpha))
  }

  async requestPermissions(): Promise<PermissionStatus> {
    const status = await SensorManager.requestPermissions()
    this.updateState({ permissionStatus: status })
    if (status === 'granted' || status === 'not-required') {
      SensorManager.stop()
      SensorManager.start()
    }
    return status
  }

  private updateState(patch: Partial<CompassState>): void {
    this._state = { ...this._state, ...patch }
    this.listeners.forEach(fn => fn(this._state))
  }

  get state(): CompassState {
    return this._state
  }

  subscribe(fn: CompassListener): () => void {
    this.listeners.add(fn)
    fn(this._state)
    return () => this.listeners.delete(fn)
  }
}

export const CompassEngine = new CompassEngineClass()
