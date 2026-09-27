'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SensorAccuracy, PermissionStatus } from '@/lib/sensors/types'
import SensorDiagnosticsSheet from './SensorDiagnosticsSheet'

const STATUS_COLORS: Record<SensorAccuracy, string> = {
  good:        '#22C55E',
  fair:        '#F59E0B',
  poor:        '#EF4444',
  unavailable: '#6A6A64',
}

const STATUS_LABELS: Record<SensorAccuracy, string> = {
  good:        'SENSOR GOOD',
  fair:        'SENSOR FAIR',
  poor:        'SENSOR POOR',
  unavailable: 'NO SENSOR',
}

interface SensorStatusDotProps {
  accuracy: SensorAccuracy
  permissionStatus: PermissionStatus
  declination: number
  northMode: 'magnetic' | 'true'
  isSimulated?: boolean
}

export default function SensorStatusDot({
  accuracy,
  permissionStatus,
  declination,
  northMode,
  isSimulated = false,
}: SensorStatusDotProps) {
  const [showDiag, setShowDiag] = useState(false)
  const color = isSimulated ? '#F59E0B' : STATUS_COLORS[accuracy]
  const label = isSimulated ? 'SIMULATED DIAL' : STATUS_LABELS[accuracy]

  return (
    <>
      <button
        className="flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-full transition-colors"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={() => setShowDiag(v => !v)}
        aria-label="Sensor status and diagnostics"
      >
        <motion.span
          className="w-2 h-2 rounded-full block"
          style={{ background: color }}
          animate={
            accuracy === 'poor' && !isSimulated
              ? { opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }
              : { opacity: 1, scale: 1 }
          }
          transition={
            accuracy === 'poor' && !isSimulated
              ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              : {}
          }
        />
        <span className="text-[10px] font-medium tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </button>

      <SensorDiagnosticsSheet
        isOpen={showDiag}
        onClose={() => setShowDiag(false)}
        accuracy={accuracy}
        permissionStatus={permissionStatus}
        declination={declination}
        northMode={northMode}
      />
    </>
  )
}
