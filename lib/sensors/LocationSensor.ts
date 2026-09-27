import type { LocationReading, PermissionStatus } from './types'

type LocationListener = (reading: LocationReading) => void
type StatusListener = (status: PermissionStatus) => void

export class LocationSensor {
  private listeners: Set<LocationListener> = new Set()
  private statusListeners: Set<StatusListener> = new Set()
  private watchId: number | null = null
  private _status: PermissionStatus = 'prompt'
  private _lastReading: LocationReading | null = null

  start(): void {
    if (this.watchId !== null || typeof window === 'undefined') return
    if (!('geolocation' in navigator)) {
      this.setStatus('unavailable')
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        this.setStatus('granted')
        const reading: LocationReading = {
          latitude:         pos.coords.latitude,
          longitude:        pos.coords.longitude,
          altitude:         pos.coords.altitude,
          accuracy:         pos.coords.accuracy,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading:          pos.coords.heading,
          speed:            pos.coords.speed,
          timestamp:        pos.timestamp,
        }
        this._lastReading = reading
        this.listeners.forEach(fn => fn(reading))
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          this.setStatus('denied')
        } else {
          this.setStatus('unavailable')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    )
  }

  stop(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  private setStatus(status: PermissionStatus): void {
    this._status = status
    this.statusListeners.forEach(fn => fn(status))
  }

  get status(): PermissionStatus {
    return this._status
  }

  get lastReading(): LocationReading | null {
    return this._lastReading
  }

  subscribe(fn: LocationListener): () => void {
    this.listeners.add(fn)
    if (this._lastReading) fn(this._lastReading)
    return () => this.listeners.delete(fn)
  }

  subscribeStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn)
    fn(this._status)
    return () => this.statusListeners.delete(fn)
  }
}

export const locationSensor = new LocationSensor()
