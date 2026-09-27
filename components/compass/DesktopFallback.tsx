'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface DesktopFallbackProps {
  onSimulate: () => void
  onRetry: () => void
}

export default function DesktopFallback({ onSimulate, onRetry }: DesktopFallbackProps) {
  return (
    <motion.div
      className="w-full max-w-xs rounded-2xl p-4 text-center flex flex-col items-center gap-3"
      style={{
        background: 'rgba(20, 20, 20, 0.92)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
        <h2 className="text-xs font-semibold tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>
          COMPASS SENSORS UNAVAILABLE
        </h2>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Your browser or desktop device isn&apos;t providing live orientation sensors. Drag the compass dial to test it interactively, or explore offline tools.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 w-full">
        <button
          onClick={onSimulate}
          className="px-4 py-2 rounded-full text-[11px] font-semibold tracking-wider min-h-[40px]"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          INTERACTIVE DIAL
        </button>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-full text-[11px] font-semibold tracking-wider min-h-[40px]"
          style={{
            background: 'var(--surface-raised)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          RETRY
        </button>
        <Link
          href="/tools"
          className="px-4 py-2 rounded-full text-[11px] font-semibold tracking-wider min-h-[40px] flex items-center"
          style={{
            background: 'var(--surface-raised)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          TOOLS →
        </Link>
      </div>
    </motion.div>
  )
}
