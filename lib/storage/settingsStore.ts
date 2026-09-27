import { Settings, DEFAULT_SETTINGS } from './types'

const KEY = 'axis:settings'

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage errors
  }
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const current = loadSettings()
  const next = { ...current, ...patch }
  saveSettings(next)
  return next
}
