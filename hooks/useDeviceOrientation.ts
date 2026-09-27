'use client'

import { useState, useEffect } from 'react'
import { SensorManager } from '@/lib/sensors/SensorManager'
import type { OrientationReading } from '@/lib/sensors/types'

export function useDeviceOrientation() {
  const [reading, setReading] = useState<OrientationReading | null>(
    SensorManager.state.orientation
  )

  useEffect(() => {
    return SensorManager.subscribe(state => setReading(state.orientation))
  }, [])

  return reading
}
