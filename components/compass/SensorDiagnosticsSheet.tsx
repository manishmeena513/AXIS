'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation'
import { useDeviceMotion } from '@/hooks/useDeviceMotion'
import type { SensorAccuracy, PermissionStatus } from '@/lib/sensors/types'

interface SensorDiagnosticsSheetProps {
  isOpen: boolean
  onClose: () => void
  accuracy: SensorAccuracy
  permissionStatus: PermissionStatus
  declination: number
  northMode: 'magnetic' | 'true'
}

export default function SensorDiagnosticsSheet({
  isOpen,
  onClose,
  accuracy,
  permissionStatus,
  declination,
  northMode,
}: SensorDiagnosticsSheetProps) {
  const orientation = useDeviceOrientation()
  const motionReading = useDeviceMotion()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 bottom-20 z-50 rounded-2xl p-5 max-w-sm mx-auto"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-semibold tracking-[0.25em]"
                style={{ color: 'var(--text-secondary)' }}
              >
                SENSOR DIAGNOSTICS
              </span>
              <button
                onClick={onClose}
                className="text-xs min-h-[44px] min-w-[44px] flex items-center justify-end"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close diagnostics"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <DiagRow label="Sensor Accuracy" value={accuracy.toUpperCase()} />
              <DiagRow
                label="Orientation Mode"
                value={orientation?.absolute ? 'Absolute (Magnetometer)' : 'Relative / Standard'}
              />
              <DiagRow label="Permission State" value={permissionStatus.toUpperCase()} />
              <DiagRow
                label="Heading (α)"
                value={orientation?.alpha != null ? `${orientation.alpha.toFixed(1)}°` : '—'}
              />
              <DiagRow
                label="Pitch (β)"
                value={orientation?.beta != null ? `${orientation.beta.toFixed(1)}°` : '—'}
              />
              <DiagRow
                label="Roll (γ)"
                value={orientation?.gamma != null ? `${orientation.gamma.toFixed(1)}°` : '—'}
              />
              <DiagRow
                label="Motion Accel (Z)"
                value={motionReading?.accelerationZ != null ? `${motionReading.accelerationZ.toFixed(2)} m/s²` : '—'}
              />
              <DiagRow
                label="North Reference"
                value={
                  northMode === 'true'
                    ? `True North (${declination >= 0 ? '+' : ''}${declination.toFixed(1)}°)`
                    : 'Magnetic North'
                }
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )
}
