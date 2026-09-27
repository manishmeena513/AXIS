'use client'

import { motion } from 'framer-motion'

interface SensorPermissionPromptProps {
  onRequest: () => void
  requesting: boolean
}

export default function SensorPermissionPrompt({ onRequest, requesting }: SensorPermissionPromptProps) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 px-8"
      style={{ background: 'rgba(10,10,10,0.92)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '1.75rem' }}>⊕</span>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Enable Compass</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          To use the compass, AXIS needs access to your device orientation sensor.
        </p>
      </div>
      <button
        onClick={onRequest}
        disabled={requesting}
        className="px-10 py-4 rounded-full text-sm font-semibold tracking-widest w-full max-w-xs transition-all"
        style={{
          background: requesting ? 'var(--accent-dim)' : 'var(--accent)',
          color: '#000',
          opacity: requesting ? 0.7 : 1,
        }}
      >
        {requesting ? 'REQUESTING…' : 'ENABLE COMPASS'}
      </button>
    </motion.div>
  )
}
