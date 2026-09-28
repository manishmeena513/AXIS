'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadSettings, updateSettings } from '@/lib/storage/settingsStore'
import type { Settings } from '@/lib/storage/types'

type ThemeValue = Settings['theme']
export type ResolvedTheme = 'dark' | 'light'

const THEME_EVENT = 'axis-theme-change'

function resolveThemeValue(t: ThemeValue): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return t
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeValue>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  const syncFromStorage = useCallback(() => {
    const settings = loadSettings()
    const resolved = resolveThemeValue(settings.theme)
    setThemeState(settings.theme)
    setResolvedTheme(resolved)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved)
    }
  }, [])

  useEffect(() => {
    syncFromStorage()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMqChange = () => syncFromStorage()
    const onThemeEvent = () => syncFromStorage()

    mq.addEventListener('change', onMqChange)
    window.addEventListener(THEME_EVENT, onThemeEvent)
    return () => {
      mq.removeEventListener('change', onMqChange)
      window.removeEventListener(THEME_EVENT, onThemeEvent)
    }
  }, [syncFromStorage])

  const setTheme = useCallback((t: ThemeValue) => {
    updateSettings({ theme: t })
    const resolved = resolveThemeValue(t)
    setThemeState(t)
    setResolvedTheme(resolved)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved)
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(THEME_EVENT))
    }
  }, [])

  return { theme, setTheme, resolvedTheme, isLight: resolvedTheme === 'light' }
}
