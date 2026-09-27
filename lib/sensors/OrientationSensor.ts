import type { OrientationReading } from './types'

type Listener = (reading: OrientationReading) => void
type AvailabilityListener = (available: boolean) => void

type ExtendedDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

export class OrientationSensor {
  private listeners: Set<Listener> = new Set()
  private availabilityListeners: Set<AvailabilityListener> = new Set()
  private handler: ((e: DeviceOrientationEvent) => void) | null = null
  private absoluteHandler: ((e: DeviceOrientationEvent) => void) | null = null
  private useAbsolute = false
  private hasReceivedValidReading = false
  private detectionTimer: ReturnType<typeof setTimeout> | null = null

  start(): void {
    if (this.handler || typeof window === 'undefined') return

    const emit = (e: ExtendedDeviceOrientationEvent, absolute: boolean) => {
      // Determine clockwise compass heading (0° = North, 90° = East, 180° = South, 270° = West)
      let heading: number | null = null

      if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
        heading = ((e.webkitCompassHeading % 360) + 360) % 360
      } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        // Standard Web DeviceOrientation alpha is counter-clockwise [0, 360)
        heading = ((360 - e.alpha) % 360 + 360) % 360
      }

      if (heading !== null && !this.hasReceivedValidReading) {
        this.hasReceivedValidReading = true
        if (this.detectionTimer) {
          clearTimeout(this.detectionTimer)
          this.detectionTimer = null
        }
        this.availabilityListeners.forEach(fn => fn(true))
      }

      const reading: OrientationReading = {
        alpha:     heading,
        rawAlpha:  e.alpha,
        beta:      e.beta,
        gamma:     e.gamma,
        absolute:  absolute || Boolean(e.absolute) || typeof e.webkitCompassHeading === 'number',
        timestamp: Date.now(),
      }
      this.listeners.forEach(fn => fn(reading))
    }

    // Try absolute orientation first (gives true magnetic compass heading on Android Chrome)
    this.absoluteHandler = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        this.useAbsolute = true
        emit(e as ExtendedDeviceOrientationEvent, true)
      }
    }

    this.handler = (e: DeviceOrientationEvent) => {
      if (!this.useAbsolute) {
        emit(e as ExtendedDeviceOrientationEvent, false)
      }
    }

    window.addEventListener('deviceorientationabsolute', this.absoluteHandler as EventListener, true)
    window.addEventListener('deviceorientation', this.handler as EventListener, true)

    // Detect if device/browser never provides valid orientation readings (e.g. Desktop Chrome)
    this.detectionTimer = setTimeout(() => {
      if (!this.hasReceivedValidReading) {
        this.availabilityListeners.forEach(fn => fn(false))
      }
    }, 1500)
  }

  stop(): void {
    if (typeof window !== 'undefined') {
      if (this.handler) {
        window.removeEventListener('deviceorientation', this.handler as EventListener, true)
        this.handler = null
      }
      if (this.absoluteHandler) {
        window.removeEventListener('deviceorientationabsolute', this.absoluteHandler as EventListener, true)
        this.absoluteHandler = null
      }
    }
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer)
      this.detectionTimer = null
    }
    this.useAbsolute = false
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  subscribeAvailability(fn: AvailabilityListener): () => void {
    this.availabilityListeners.add(fn)
    return () => this.availabilityListeners.delete(fn)
  }

  get isAbsolute(): boolean {
    return this.useAbsolute
  }

  get isAvailable(): boolean {
    return this.hasReceivedValidReading
  }
}
