'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadSettings, updateSettings } from '@/lib/storage/settingsStore'
import type { Settings } from '@/lib/storage/types'

type ThemeValue = Settings['theme']
type ResolvedTheme = 'dark' | 'light'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeValue>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  const applyTheme = useCallback((t: ThemeValue) => {
    const resolved: ResolvedTheme =
      t === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : t
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  useEffect(() => {
    const settings = loadSettings()
    setThemeState(settings.theme)
    applyTheme(settings.theme)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const s = loadSettings()
      if (s.theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [applyTheme])

  const setTheme = useCallback((t: ThemeValue) => {
    setThemeState(t)
    updateSettings({ theme: t })
    applyTheme(t)
  }, [applyTheme])

  return { theme, setTheme, resolvedTheme }
}
