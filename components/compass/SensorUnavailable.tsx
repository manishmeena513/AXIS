'use client'

import { motion } from 'framer-motion'

interface SensorUnavailableProps {
  onRetry: () => void
}

export default function SensorUnavailable({ onRetry }: SensorUnavailableProps) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-8"
      style={{ background: 'var(--bg)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">⊗</span>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Compass Unavailable</h2>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          Your browser or device isn't providing the required orientation sensor.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="px-8 py-3 rounded-full text-sm font-semibold tracking-widest transition-all"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          RETRY
        </button>
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 rounded-full text-sm font-semibold tracking-widest"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          LEARN MORE
        </a>
      </div>
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        You can still use Sun, Moon, Qibla, Bearing, and other tools.
      </p>
    </motion.div>
  )
}
