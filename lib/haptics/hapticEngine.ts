import { loadSettings } from '@/lib/storage/settingsStore'
import { soundEngine } from '@/lib/sound/soundEngine'

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

function shouldHaptic(): boolean {
  if (!canVibrate()) return false
  const settings = loadSettings()
  return settings.haptics
}

export const haptic = {
  cardinalCross(): void {
    soundEngine.click()
    if (shouldHaptic()) navigator.vibrate(25)
  },
  lockAchieved(): void {
    soundEngine.lock()
    if (shouldHaptic()) navigator.vibrate([35, 20, 35])
  },
  aligned(): void {
    soundEngine.aligned()
    if (shouldHaptic()) navigator.vibrate(45)
  },
  calibrated(): void {
    soundEngine.calibrated()
    if (shouldHaptic()) navigator.vibrate([25, 25, 55])
  },
  levelAchieved(): void {
    soundEngine.level()
    if (shouldHaptic()) navigator.vibrate([20, 20, 20])
  },
}
