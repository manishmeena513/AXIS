'use client'

import { useState, useCallback } from 'react'
import { CompassEngine } from '@/lib/compass/CompassEngine'
import type { PermissionStatus } from '@/lib/sensors/types'
import { checkOrientationAvailability } from '@/lib/sensors/PermissionManager'

export function useSensorPermission() {
  const [status, setStatus] = useState<PermissionStatus>(() => {
    if (typeof window === 'undefined') return 'unavailable'
    return checkOrientationAvailability()
  })
  const [requesting, setRequesting] = useState(false)

  const requestPermissions = useCallback(async () => {
    setRequesting(true)
    try {
      const result = await CompassEngine.requestPermissions()
      setStatus(result)
      return result
    } finally {
      setRequesting(false)
    }
  }, [])

  return { status, requesting, requestPermissions }
}
