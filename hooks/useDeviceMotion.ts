'use client'

import { useState, useEffect } from 'react'
import { SensorManager } from '@/lib/sensors/SensorManager'
import type { MotionReading } from '@/lib/sensors/types'

export function useDeviceMotion() {
  const [reading, setReading] = useState<MotionReading | null>(
    SensorManager.state.motion
  )

  useEffect(() => {
    return SensorManager.subscribe(state => setReading(state.motion))
  }, [])

  return reading
}
