'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SensorAccuracy } from '@/lib/sensors/types'
import { haptic } from '@/lib/haptics/hapticEngine'

interface CalibrationPromptProps {
  isOpen: boolean
  accuracy: SensorAccuracy
  progress: number
  onComplete: () => void
  onClose: () => void
}

export default function CalibrationPrompt({
  isOpen,
  accuracy,
  progress,
  onComplete,
  onClose,
}: CalibrationPromptProps) {
  const [calibrated, setCalibrated] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCalibrated(false)
      return
    }
    if (progress >= 100 && !calibrated) {
      handleFinish()
    }
  }, [isOpen, progress, calibrated])

  function handleFinish() {
    setCalibrated(true)
    haptic.calibrated()
    onComplete()
    setTimeout(() => {
      onClose()
    }, 1100)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-full px-6 text-center"
          style={{
            background: 'rgba(10, 10, 10, 0.84)',
            backdropFilter: 'blur(6px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {!calibrated ? (
            <div className="flex flex-col items-center gap-4">
              <span
                className="text-[10px] font-semibold tracking-[0.3em]"
                style={{ color: 'var(--text-secondary)' }}
              >
                CALIBRATION
              </span>

              <p className="text-sm leading-snug max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                Move your phone in a figure-eight.
              </p>

              {/* Animated Figure-8 SVG */}
              <div className="relative w-32 h-16 flex items-center justify-center my-1">
                <svg viewBox="0 0 120 60" className="w-full h-full overflow-visible">
                  <path
                    d="M60,30 C40,5 10,5 10,30 C10,55 40,55 60,30 C80,5 110,5 110,30 C110,55 80,55 60,30 Z"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="2.5"
                  />
                  <motion.path
                    d="M60,30 C40,5 10,5 10,30 C10,55 40,55 60,30 C80,5 110,5 110,30 C110,55 80,55 60,30 Z"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="60 220"
                    animate={{ strokeDashoffset: [0, -280] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                  />
                </svg>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  SENSOR ACCURACY
                </span>
                <span
                  className="text-xs font-semibold tracking-widest"
                  style={{
                    color:
                      accuracy === 'good'
                        ? '#22C55E'
                        : accuracy === 'fair'
                        ? '#F59E0B'
                        : '#EF4444',
                  }}
                >
                  {accuracy === 'unavailable' ? 'LOW' : accuracy.toUpperCase()}
                </span>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleFinish}
                  className="px-5 py-2 rounded-full text-[11px] font-semibold tracking-widest min-h-[44px]"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  DONE
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full text-[11px] font-semibold tracking-widest min-h-[44px]"
                  style={{
                    background: 'var(--surface-raised)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  DISMISS
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
              >
                ✓
              </div>
              <span className="text-sm font-semibold tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Compass calibrated
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
