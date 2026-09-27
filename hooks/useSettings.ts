'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadSettings, updateSettings } from '@/lib/storage/settingsStore'
import type { Settings } from '@/lib/storage/types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const update = useCallback((patch: Partial<Settings>) => {
    const next = updateSettings(patch)
    setSettings(next)
  }, [])

  return { settings, update }
}
