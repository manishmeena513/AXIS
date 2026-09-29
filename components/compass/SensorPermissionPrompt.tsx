'use client'

import { motion } from 'framer-motion'

interface SensorPermissionPromptProps {
  onRequest: () => void
  requesting: boolean
  permissionDenied?: boolean
}

export default function SensorPermissionPrompt({
  onRequest,
  requesting,
  permissionDenied = false,
}: SensorPermissionPromptProps) {
  return (
    <motion.div
      className="absolute inset-0 z-20 rounded-full flex flex-col items-center justify-center gap-5 px-7 text-center"
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
      <div className="flex flex-col items-center gap-2.5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--accent)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>

        <h2
          className="text-xs font-bold tracking-[0.22em]"
          style={{ color: 'var(--text-primary)' }}
        >
          {permissionDenied ? 'COMPASS ACCESS REQUIRED' : 'ENABLE COMPASS'}
        </h2>

        <p
          className="text-xs leading-relaxed max-w-[210px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          AXIS needs access to your device orientation sensor.
        </p>
      </div>

      <button
        onClick={onRequest}
        disabled={requesting}
        className="instrument-btn instrument-btn-active px-7 py-3 rounded-full text-[11px] font-mono font-semibold tracking-[0.18em] transition-all min-h-[42px]"
        style={{
          opacity: requesting ? 0.7 : 1,
        }}
      >
        {requesting ? 'REQUESTING…' : 'ENABLE COMPASS'}
      </button>
    </motion.div>
  )
}
