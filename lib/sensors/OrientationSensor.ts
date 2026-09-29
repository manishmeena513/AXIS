import type { OrientationReading } from './types'

type Listener = (reading: OrientationReading) => void
type AvailabilityListener = (available: boolean) => void

type ExtendedDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

/** Validate that a heading is a finite number in [0, 360) */
export function isValidHeading(heading: unknown): heading is number {
  return (
    typeof heading === 'number' &&
    Number.isFinite(heading) &&
    heading >= 0 &&
    heading < 360
  )
}

export class OrientationSensor {
  private listeners: Set<Listener> = new Set()
  private availabilityListeners: Set<AvailabilityListener> = new Set()
  private handler: ((e: DeviceOrientationEvent) => void) | null = null
  private absoluteHandler: ((e: DeviceOrientationEvent) => void) | null = null
  private useAbsolute = false
  private hasReceivedValidReading = false
  private detectionTimer: ReturnType<typeof setTimeout> | null = null

  start(timeoutMs = 1400): void {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      this.availabilityListeners.forEach(fn => fn(false))
      return
    }

    // If already listening, only restart the detection timer if no valid reading has arrived yet
    if (this.handler) {
      if (!this.hasReceivedValidReading) {
        this.scheduleDetectionTimeout(timeoutMs)
      }
      return
    }

    const emit = (e: ExtendedDeviceOrientationEvent, absolute: boolean) => {
      // Determine clockwise compass heading (0° = North, 90° = East, 180° = South, 270° = West)
      let heading: number | null = null

      if (
        typeof e.webkitCompassHeading === 'number' &&
        Number.isFinite(e.webkitCompassHeading) &&
        e.webkitCompassHeading >= 0
      ) {
        heading = ((e.webkitCompassHeading % 360) + 360) % 360
      } else if (typeof e.alpha === 'number' && Number.isFinite(e.alpha)) {
        // Standard Web DeviceOrientation alpha is counter-clockwise [0, 360)
        heading = ((360 - e.alpha) % 360 + 360) % 360
      }

      if (isValidHeading(heading)) {
        if (this.detectionTimer) {
          clearTimeout(this.detectionTimer)
          this.detectionTimer = null
        }
        if (!this.hasReceivedValidReading) {
          this.hasReceivedValidReading = true
          this.availabilityListeners.forEach(fn => fn(true))
        }
      }

      const reading: OrientationReading = {
        alpha:     isValidHeading(heading) ? heading : null,
        rawAlpha:  e.alpha,
        beta:      typeof e.beta === 'number' && Number.isFinite(e.beta) ? e.beta : null,
        gamma:     typeof e.gamma === 'number' && Number.isFinite(e.gamma) ? e.gamma : null,
        absolute:  absolute || Boolean(e.absolute) || typeof e.webkitCompassHeading === 'number',
        timestamp: Date.now(),
      }
      this.listeners.forEach(fn => fn(reading))
    }

    // Prefer absolute orientation (true magnetic compass heading on Android Chrome)
    this.absoluteHandler = (e: DeviceOrientationEvent) => {
      if (typeof e.alpha === 'number' && Number.isFinite(e.alpha)) {
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

    if (!this.hasReceivedValidReading) {
      this.scheduleDetectionTimeout(timeoutMs)
    }
  }

  private scheduleDetectionTimeout(timeoutMs: number): void {
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer)
    }
    this.detectionTimer = setTimeout(() => {
      this.detectionTimer = null
      if (!this.hasReceivedValidReading) {
        this.availabilityListeners.forEach(fn => fn(false))
      }
    }, timeoutMs)
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

  resetDetection(): void {
    this.hasReceivedValidReading = false
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
