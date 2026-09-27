'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface MagneticWarningBannerProps {
  visible: boolean
  onCalibrate: () => void
}

export default function MagneticWarningBanner({ visible, onCalibrate }: MagneticWarningBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="w-full max-w-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold" style={{ color: '#EF4444' }}>
              Magnetic interference detected
            </span>
            <span className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Move away from metal objects, magnets or electronics.
            </span>
          </div>
          <button
            onClick={onCalibrate}
            className="text-[10px] font-semibold tracking-wider px-2.5 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5' }}
          >
            CALIBRATE
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
