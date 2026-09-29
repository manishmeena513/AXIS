import { OrientationSensor, isValidHeading } from './OrientationSensor'
import { MotionSensor } from './MotionSensor'
import { CalibrationManager } from './CalibrationManager'
import {
  requestOrientationPermission,
  requestMotionPermission,
  checkOrientationAvailability,
  hasOrientationPermissionAPI,
} from './PermissionManager'
import type {
  OrientationReading,
  MotionReading,
  PermissionStatus,
  CompassStatus,
} from './types'

export interface SensorManagerState {
  orientation: OrientationReading | null
  motion: MotionReading | null
  calibrationProgress: number
  permissionStatus: PermissionStatus
  permissionMotion: PermissionStatus
  sensorAvailable: boolean
  compassStatus: CompassStatus
  permissionDenied: boolean
  hasValidHeading: boolean
  isRunning: boolean
}

type StateListener = (state: SensorManagerState) => void

const THROTTLE_MS: Record<'performance' | 'balanced' | 'saver', number> = {
  performance: 0,
  balanced:    33,
  saver:       100,
}

class SensorManagerClass {
  private orientationSensor = new OrientationSensor()
  private motionSensor = new MotionSensor()
  private calibration = new CalibrationManager()
  private listeners: Set<StateListener> = new Set()
  private hasAttemptedPermissionRequest = false
  private _state: SensorManagerState = {
    orientation: null,
    motion: null,
    calibrationProgress: 0,
    permissionStatus: 'prompt',
    permissionMotion: 'not-required',
    sensorAvailable: true,
    compassStatus: 'IDLE',
    permissionDenied: false,
    hasValidHeading: false,
    isRunning: false,
  }
  private visibilityHandler: (() => void) | null = null
  private unsubOrientation: (() => void) | null = null
  private unsubAvailability: (() => void) | null = null
  private unsubMotion: (() => void) | null = null
  private throttleMs = 33
  private lastEmitTime = 0

  setBatteryMode(mode: 'performance' | 'balanced' | 'saver'): void {
    this.throttleMs = THROTTLE_MS[mode]
  }

  async requestPermissions(): Promise<PermissionStatus> {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      this.updateState({
        permissionStatus: 'unavailable',
        sensorAvailable: false,
        hasValidHeading: false,
        compassStatus: 'UNAVAILABLE',
      })
      return 'unavailable'
    }

    this.hasAttemptedPermissionRequest = true
    this.updateState({
      compassStatus: 'REQUESTING_PERMISSION',
      permissionDenied: false,
    })

    try {
      const [orientStatus, motionStatus] = await Promise.all([
        requestOrientationPermission(),
        requestMotionPermission(),
      ])

      if (orientStatus === 'denied') {
        this.updateState({
          permissionStatus: 'denied',
          permissionMotion: motionStatus,
          permissionDenied: true,
          hasValidHeading: false,
          compassStatus: 'PERMISSION_REQUIRED',
        })
        return 'denied'
      }

      if (orientStatus === 'unavailable') {
        this.updateState({
          permissionStatus: 'unavailable',
          permissionMotion: motionStatus,
          sensorAvailable: false,
          hasValidHeading: false,
          compassStatus: 'UNAVAILABLE',
        })
        return 'unavailable'
      }

      // Permission granted or not-required: start/restart sensors and wait for first valid heading
      this.updateState({
        permissionStatus: orientStatus,
        permissionMotion: motionStatus,
        permissionDenied: false,
        compassStatus: this._state.hasValidHeading ? 'ACTIVE' : 'REQUESTING_PERMISSION',
      })

      this.orientationSensor.stop()
      this.motionSensor.stop()
      if (!this._state.isRunning) {
        this.start()
      } else {
        this.orientationSensor.start(1800)
        this.motionSensor.start()
      }

      return orientStatus
    } catch {
      this.updateState({
        hasValidHeading: false,
        compassStatus: 'ERROR',
      })
      return 'denied'
    }
  }

  start(): void {
    if (typeof window === 'undefined') return

    if (typeof DeviceOrientationEvent === 'undefined') {
      this.updateState({
        permissionStatus: 'unavailable',
        sensorAvailable: false,
        hasValidHeading: false,
        compassStatus: 'UNAVAILABLE',
        isRunning: false,
      })
      return
    }

    if (this._state.isRunning) {
      if (this._state.hasValidHeading && this._state.compassStatus !== 'ACTIVE') {
        this.updateState({ compassStatus: 'ACTIVE' })
      }
      return
    }

    const avail = checkOrientationAvailability()

    this.unsubAvailability = this.orientationSensor.subscribeAvailability(available => {
      if (available) {
        this.updateState({
          sensorAvailable: true,
          permissionStatus: 'granted',
          permissionDenied: false,
          hasValidHeading: true,
          compassStatus: 'ACTIVE',
        })
        return
      }

      // No valid reading arrived before the timeout elapsed
      if (this._state.hasValidHeading) return

      if (this._state.permissionDenied) {
        this.updateState({
          compassStatus: 'PERMISSION_REQUIRED',
          hasValidHeading: false,
        })
      } else if (hasOrientationPermissionAPI() && !this.hasAttemptedPermissionRequest) {
        this.updateState({
          permissionStatus: 'prompt',
          compassStatus: 'PERMISSION_REQUIRED',
          hasValidHeading: false,
        })
      } else {
        this.updateState({
          sensorAvailable: false,
          compassStatus: 'UNAVAILABLE',
          hasValidHeading: false,
        })
      }
    })

    this.unsubMotion = this.motionSensor.subscribe(motion => {
      this.updateState({ motion })
    })

    this.unsubOrientation = this.orientationSensor.subscribe(reading => {
      const now = Date.now()
      const hasValidAlpha = isValidHeading(reading.alpha)

      // Never throttle the very first valid reading so transition to ACTIVE is immediate
      if (this._state.hasValidHeading && this.throttleMs > 0 && now - this.lastEmitTime < this.throttleMs) {
        return
      }
      this.lastEmitTime = now

      if (!hasValidAlpha) {
        // Still allow tilt (beta/gamma) updates for Level tool without falsely marking compass active
        if (reading.beta !== null || reading.gamma !== null) {
          this.updateState({
            orientation: reading,
          })
        }
        return
      }

      const calibrationProgress = this.calibration.update(reading.alpha!)
      this.updateState({
        orientation: reading,
        calibrationProgress,
        sensorAvailable: true,
        permissionStatus: 'granted',
        permissionDenied: false,
        hasValidHeading: true,
        compassStatus: 'ACTIVE',
      })
    })

    // On browsers with requestPermission API (e.g. iOS), probe briefly (350ms) in case
    // permission was already granted before a page refresh; otherwise transition to PERMISSION_REQUIRED.
    const initialTimeoutMs = avail === 'prompt' ? 350 : 1400
    this.orientationSensor.start(initialTimeoutMs)
    this.motionSensor.start()

    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (document.hidden) {
          this.orientationSensor.stop()
          this.motionSensor.stop()
        } else {
          this.orientationSensor.start(1400)
          this.motionSensor.start()
        }
      }
      document.addEventListener('visibilitychange', this.visibilityHandler)
    }

    this.updateState({
      isRunning: true,
      permissionStatus: this._state.hasValidHeading ? 'granted' : avail,
      compassStatus: this._state.hasValidHeading ? 'ACTIVE' : 'IDLE',
    })
  }

  stop(): void {
    this.orientationSensor.stop()
    this.motionSensor.stop()
    this.unsubOrientation?.()
    this.unsubAvailability?.()
    this.unsubMotion?.()
    this.unsubOrientation = null
    this.unsubAvailability = null
    this.unsubMotion = null
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
    this.updateState({ isRunning: false })
  }

  markCalibrated(): void {
    this.calibration.markCalibrated()
    this.updateState({
      calibrationProgress: 100,
    })
  }

  private updateState(patch: Partial<SensorManagerState>): void {
    this._state = { ...this._state, ...patch }
    this.listeners.forEach(fn => fn(this._state))
  }

  get state(): SensorManagerState {
    return this._state
  }

  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn)
    fn(this._state)
    return () => this.listeners.delete(fn)
  }
}

export const SensorManager = new SensorManagerClass()
