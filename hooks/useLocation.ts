'use client'

import { useState, useEffect, useCallback } from 'react'
import { locationSensor } from '@/lib/sensors/LocationSensor'
import { CompassEngine } from '@/lib/compass/CompassEngine'
import type { LocationReading, PermissionStatus } from '@/lib/sensors/types'

export function useLocation(autoStart = false) {
  const [reading, setReading] = useState<LocationReading | null>(
    locationSensor.lastReading
  )
  const [permissionState, setPermissionState] = useState<PermissionStatus>(
    locationSensor.status
  )

  useEffect(() => {
    const unsubLoc = locationSensor.subscribe(loc => {
      setReading(loc)
      CompassEngine.setLocation(loc.latitude, loc.longitude)
    })
    const unsubStatus = locationSensor.subscribeStatus(setPermissionState)

    if (autoStart) {
      locationSensor.start()
    }

    return () => {
      unsubLoc()
      unsubStatus()
    }
  }, [autoStart])

  const requestLocation = useCallback(() => {
    locationSensor.start()
  }, [])

  const stopLocation = useCallback(() => {
    locationSensor.stop()
  }, [])

  return {
    coords: reading ? { latitude: reading.latitude, longitude: reading.longitude } : null,
    altitude: reading?.altitude ?? null,
    accuracy: reading?.accuracy ?? null,
    speed: reading?.speed ?? null,
    heading: reading?.heading ?? null,
    timestamp: reading?.timestamp ?? null,
    permissionState,
    requestLocation,
    stopLocation,
  }
}
