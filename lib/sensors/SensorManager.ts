import { OrientationSensor } from './OrientationSensor'
import { MotionSensor } from './MotionSensor'
import { CalibrationManager } from './CalibrationManager'
import {
  requestOrientationPermission,
  requestMotionPermission,
  checkOrientationAvailability,
} from './PermissionManager'
import type {
  OrientationReading,
  MotionReading,
  PermissionStatus,
} from './types'

export interface SensorManagerState {
  orientation: OrientationReading | null
  motion: MotionReading | null
  calibrationProgress: number
  permissionStatus: PermissionStatus
  permissionMotion: PermissionStatus
  sensorAvailable: boolean
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
  private _state: SensorManagerState = {
    orientation: null,
    motion: null,
    calibrationProgress: 0,
    permissionStatus: 'prompt',
    permissionMotion: 'not-required',
    sensorAvailable: true,
    isRunning: false,
  }
  private visibilityHandler: (() => void) | null = null
  private unsubOrientation: (() => void) | null = null
  private unsubAvailability: (() => void) | null = null
  private unsubMotion: (() => void) | null = null
  private throttleMs = 33
  private lastEmitTime = 0

  constructor() {
    if (typeof window !== 'undefined') {
      this._state.permissionStatus = checkOrientationAvailability()
    }
  }

  setBatteryMode(mode: 'performance' | 'balanced' | 'saver'): void {
    this.throttleMs = THROTTLE_MS[mode]
  }

  async requestPermissions(): Promise<PermissionStatus> {
    const [orientStatus, motionStatus] = await Promise.all([
      requestOrientationPermission(),
      requestMotionPermission(),
    ])
    this.updateState({
      permissionStatus: orientStatus,
      permissionMotion: motionStatus,
    })
    return orientStatus
  }

  start(): void {
    if (this._state.isRunning) return

    this.unsubAvailability = this.orientationSensor.subscribeAvailability(available => {
      this.updateState({
        sensorAvailable: available,
      })
    })

    this.unsubMotion = this.motionSensor.subscribe(motion => {
      this.updateState({ motion })
    })

    this.unsubOrientation = this.orientationSensor.subscribe(reading => {
      const now = Date.now()
      if (this.throttleMs > 0 && now - this.lastEmitTime < this.throttleMs) {
        return
      }
      this.lastEmitTime = now

      if (reading.alpha === null) {
        this.updateState({
          orientation: reading,
          sensorAvailable: false,
        })
        return
      }

      const calibrationProgress = this.calibration.update(reading.alpha)
      this.updateState({
        orientation: reading,
        calibrationProgress,
        sensorAvailable: true,
      })
    })

    this.orientationSensor.start()
    this.motionSensor.start()

    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (document.hidden) {
          this.orientationSensor.stop()
          this.motionSensor.stop()
        } else {
          this.orientationSensor.start()
          this.motionSensor.start()
        }
      }
      document.addEventListener('visibilitychange', this.visibilityHandler)
    }

    this.updateState({ isRunning: true })
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
