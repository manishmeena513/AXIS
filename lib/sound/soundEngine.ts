import { loadSettings } from '@/lib/storage/settingsStore'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) {
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function shouldPlaySound(): boolean {
  if (typeof window === 'undefined') return false
  return loadSettings().sound
}

function playTone(freq: number, durationMs: number, gainPeak = 0.045, type: OscillatorType = 'sine'): void {
  if (!shouldPlaySound()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime

    osc.type = type
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + durationMs / 1000 + 0.01)
  } catch {
    // Ignore audio context restrictions
  }
}

export const soundEngine = {
  click(): void {
    playTone(420, 18, 0.03, 'triangle')
  },
  lock(): void {
    playTone(660, 45, 0.04, 'sine')
  },
  aligned(): void {
    playTone(880, 65, 0.045, 'sine')
  },
  calibrated(): void {
    playTone(740, 80, 0.045, 'sine')
  },
  level(): void {
    playTone(784, 55, 0.04, 'sine')
  },
}
