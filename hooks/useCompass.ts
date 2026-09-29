'use client'

import { useState, useEffect, useCallback } from 'react'
import { CompassEngine } from '@/lib/compass/CompassEngine'
import type { CompassState } from '@/lib/compass/CompassEngine'
import { loadSettings, updateSettings } from '@/lib/storage/settingsStore'

export function useCompass() {
  const [state, setState] = useState<CompassState>(() => CompassEngine.state)

  useEffect(() => {
    const settings = loadSettings()
    CompassEngine.setBatteryMode(settings.batteryMode)
    CompassEngine.setNorthMode(settings.northMode)
    CompassEngine.start()

    const unsub = CompassEngine.subscribe(setState)
    return () => {
      unsub()
    }
  }, [])

  const lock = useCallback((heading?: number) => {
    CompassEngine.lockHeading(heading)
  }, [])

  const unlock = useCallback(() => {
    CompassEngine.unlockHeading()
  }, [])

  const setNorthMode = useCallback((mode: 'magnetic' | 'true') => {
    CompassEngine.setNorthMode(mode)
    updateSettings({ northMode: mode })
  }, [])

  const resetTilt = useCallback(() => {
    CompassEngine.resetTilt()
  }, [])

  const setSimulatedHeading = useCallback((heading: number, tiltX = 0, tiltY = 0) => {
    CompassEngine.setSimulatedHeading(heading, tiltX, tiltY)
  }, [])

  const markCalibrated = useCallback(() => {
    CompassEngine.markCalibrated()
  }, [])

  const requestPermissions = useCallback(async () => {
    return CompassEngine.requestPermissions()
  }, [])

  return {
    ...state,
    lock,
    unlock,
    setNorthMode,
    resetTilt,
    setSimulatedHeading,
    markCalibrated,
    requestPermissions,
  }
}
