'use client'

import { motion } from 'framer-motion'

interface SensorUnavailableProps {
  mode?: 'unavailable' | 'error'
  onRetry: () => void
  onSimulate?: () => void
}

export default function SensorUnavailable({
  mode = 'unavailable',
  onRetry,
  onSimulate,
}: SensorUnavailableProps) {
  const isError = mode === 'error'

  return (
    <motion.div
      className="absolute inset-0 z-20 rounded-full flex flex-col items-center justify-center gap-4 px-7 text-center"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-mono"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          ⊗
        </div>

        <h2
          className="text-xs font-bold tracking-[0.22em]"
          style={{ color: 'var(--text-primary)' }}
        >
          {isError ? 'COMPASS SENSOR ERROR' : 'COMPASS UNAVAILABLE'}
        </h2>

        <p
          className="text-xs leading-relaxed max-w-[215px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isError
            ? 'Unable to read from the device orientation sensor.'
            : 'Your device or browser is not providing live orientation sensor readings.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onRetry}
          className="instrument-btn instrument-btn-active px-5 py-2.5 rounded-full text-[11px] font-mono font-semibold tracking-[0.18em] min-h-[40px]"
        >
          RETRY
        </button>
        {onSimulate && (
          <button
            onClick={onSimulate}
            className="instrument-btn px-4 py-2.5 rounded-full text-[10px] font-mono font-semibold tracking-[0.16em] min-h-[40px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            INTERACTIVE DIAL
          </button>
        )}
      </div>
    </motion.div>
  )
}
