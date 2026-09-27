import type { MotionReading } from './types'

type Listener = (reading: MotionReading) => void

export class MotionSensor {
  private listeners: Set<Listener> = new Set()
  private handler: ((e: DeviceMotionEvent) => void) | null = null

  start(): void {
    if (this.handler || typeof window === 'undefined') return
    if (typeof DeviceMotionEvent === 'undefined') return

    this.handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity ?? e.acceleration
      const rot = e.rotationRate
      const reading: MotionReading = {
        accelerationX:     acc?.x ?? null,
        accelerationY:     acc?.y ?? null,
        accelerationZ:     acc?.z ?? null,
        rotationRateAlpha: rot?.alpha ?? null,
        rotationRateBeta:  rot?.beta ?? null,
        rotationRateGamma: rot?.gamma ?? null,
        timestamp:         Date.now(),
      }
      this.listeners.forEach(fn => fn(reading))
    }

    window.addEventListener('devicemotion', this.handler as EventListener, true)
  }

  stop(): void {
    if (this.handler && typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handler as EventListener, true)
      this.handler = null
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}
