'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompass } from '@/hooks/useCompass'
import { useSettings } from '@/hooks/useSettings'
import { useLocation } from '@/hooks/useLocation'
import InstrumentFrame from '@/components/ui/InstrumentFrame'
import HeadingDisplay from '@/components/compass/HeadingDisplay'
import SensorPermissionPrompt from '@/components/compass/SensorPermissionPrompt'
import SensorUnavailable from '@/components/compass/SensorUnavailable'
import CalibrationPrompt from '@/components/compass/CalibrationPrompt'
import { haptic } from '@/lib/haptics/hapticEngine'
import { shortestAngularDiff } from '@/lib/compass/CompassEngine'

const CompassScene = dynamic(() => import('@/components/3d/CompassScene'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-full flex items-center justify-center relative"
      style={{
        background: 'radial-gradient(circle at 35% 30%, #262523, #121211 75%)',
      }}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ background: 'var(--metallic-hi)' }}
      />
    </div>
  ),
})

export default function CompassPage() {
  const { settings } = useSettings()
  const compass = useCompass()
  const { requestLocation } = useLocation(false)

  const [calibrating, setCalibrating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isActive = compass.compassStatus === 'ACTIVE' && compass.hasValidHeading

  // Ensure calibration modal closes if compass leaves ACTIVE state
  useEffect(() => {
    if (!isActive && calibrating) {
      setCalibrating(false)
    }
  }, [isActive, calibrating])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => {
      setToast(prev => (prev === msg ? null : prev))
    }, 1800)
  }, [])

  // Cardinal crossing haptic (N=0, E=90, S=180, W=270) only when ACTIVE
  const lastCardinalRef = useRef<number | null>(null)
  useEffect(() => {
    if (!isActive) return
    const nearestCardinal = (Math.round(compass.heading / 90) * 90) % 360
    const distToCardinal = Math.abs(shortestAngularDiff(compass.heading, nearestCardinal))
    if (distToCardinal < 1.2) {
      if (lastCardinalRef.current !== null && lastCardinalRef.current !== nearestCardinal) {
        haptic.cardinalCross()
      }
      lastCardinalRef.current = nearestCardinal
    }
  }, [compass.heading, isActive])

  // Alignment haptic when locked heading is reached
  const wasAlignedRef = useRef(false)
  useEffect(() => {
    if (!isActive || compass.lockedHeading === null) {
      wasAlignedRef.current = false
      return
    }
    const diff = Math.abs(shortestAngularDiff(compass.heading, compass.lockedHeading))
    const aligned = diff < 2
    if (aligned && !wasAlignedRef.current) {
      haptic.aligned()
      wasAlignedRef.current = true
    } else if (!aligned) {
      wasAlignedRef.current = false
    }
  }, [compass.heading, compass.lockedHeading, isActive])

  // Toggle Magnetic <-> True North
  const handleToggleNorthMode = useCallback(() => {
    if (compass.northMode === 'magnetic') {
      if (!compass.hasLocation) {
        requestLocation()
        showToast('True North (requesting GPS declination…)')
      } else {
        showToast(`True North (${compass.declination >= 0 ? '+' : ''}${compass.declination.toFixed(1)}°)`)
      }
      compass.setNorthMode('true')
    } else {
      compass.setNorthMode('magnetic')
      showToast('Magnetic North')
    }
  }, [compass, requestLocation, showToast])

  // Gestures on Compass Instrument (Tap, Double-Tap, Long-Press, and Interactive Drag)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; startHeading: number; moved: boolean } | null>(null)
  const dialContainerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isActive) return
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startHeading: compass.heading,
        moved: false,
      }
      longPressRef.current = setTimeout(() => {
        if (dragStartRef.current && !dragStartRef.current.moved && isActive) {
          setCalibrating(true)
          haptic.lockAchieved()
        }
      }, 600)
    },
    [compass.heading, isActive]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartRef.current) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.hypot(dx, dy) > 8) {
        dragStartRef.current.moved = true
        if (longPressRef.current) {
          clearTimeout(longPressRef.current)
          longPressRef.current = null
        }
        if (compass.isSimulated) {
          const rect = dialContainerRef.current?.getBoundingClientRect()
          const tiltY = rect ? ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 25 : 0
          const tiltX = rect ? ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 25 : 0
          const newHeading = dragStartRef.current.startHeading - dx * 0.65
          compass.setSimulatedHeading(newHeading, tiltX, tiltY)
        }
      }
    },
    [compass]
  )

  const handlePointerUp = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
    const wasDragged = dragStartRef.current?.moved ?? false
    dragStartRef.current = null
    if (wasDragged || !isActive) return

    tapCountRef.current += 1
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)

    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current === 1) {
        handleToggleNorthMode()
      } else if (tapCountRef.current >= 2) {
        compass.resetTilt()
        showToast('Orientation reset')
      }
      tapCountRef.current = 0
    }, 250)
  }, [compass, handleToggleNorthMode, isActive, showToast])

  const showPermissionOverlay =
    compass.compassStatus === 'PERMISSION_REQUIRED' ||
    compass.compassStatus === 'REQUESTING_PERMISSION'

  const showUnavailableOverlay =
    compass.compassStatus === 'UNAVAILABLE' ||
    compass.compassStatus === 'ERROR'

  return (
    <InstrumentFrame className="h-full justify-between py-3 px-5">
      {/* Top Bar: Clean Active Instrument Controls */}
      <div className="w-full flex justify-between items-center z-10 pt-1 min-h-[42px]">
        <span
          className="text-[11px] font-semibold tracking-[0.28em]"
          style={{ color: 'var(--text-muted)' }}
        >
          AXIS
        </span>

        {isActive && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleNorthMode}
              className="instrument-btn text-[10px] font-mono font-semibold tracking-[0.16em] px-3 py-1.5 min-h-[38px] flex items-center"
              style={{
                color: compass.northMode === 'true' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {compass.northMode === 'true' ? 'TRUE' : 'MAG'}
            </button>

            <button
              onClick={() => {
                if (compass.lockedHeading !== null) {
                  compass.unlock()
                } else {
                  compass.lock()
                  haptic.lockAchieved()
                }
              }}
              className={`${
                compass.lockedHeading !== null ? 'instrument-btn-active' : 'instrument-btn'
              } text-[10px] font-mono font-semibold tracking-[0.16em] px-3.5 py-1.5 min-h-[38px] flex items-center`}
            >
              {compass.lockedHeading !== null ? 'LOCKED' : 'LOCK'}
            </button>

            <button
              onClick={() => setCalibrating(true)}
              className="instrument-btn text-[10px] font-mono font-semibold tracking-[0.16em] px-3 py-1.5 min-h-[38px] flex items-center"
              aria-label="Calibrate compass"
            >
              CAL
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="instrument-panel fixed top-16 z-40 px-4 py-1.5 text-xs font-medium tracking-wider"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3D Compass Instrument grounded into surface */}
      <motion.div
        ref={dialContainerRef}
        className="instrument-dial-shell relative w-full max-w-[308px] aspect-square my-auto flex items-center justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          touchAction: 'none',
          cursor: compass.isSimulated ? 'grab' : isActive ? 'pointer' : 'default',
        }}
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{
          opacity: calibrating ? 0.55 : 1,
          scale: 1,
          y: 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <CompassScene
          heading={isActive ? compass.heading : 0}
          tiltX={isActive ? compass.tiltX : 0}
          tiltY={isActive ? compass.tiltY : 0}
          lockedHeading={isActive ? compass.lockedHeading : null}
          motionMode={settings.motionMode}
          batteryMode={settings.batteryMode}
        />

        {/* Optional Manual Calibration Figure-8 Overlay (ONLY when sensor is ACTIVE) */}
        {isActive && (
          <CalibrationPrompt
            isOpen={calibrating}
            progress={compass.calibrationProgress}
            onComplete={() => compass.markCalibrated()}
            onClose={() => setCalibrating(false)}
          />
        )}

        {/* PERMISSION_REQUIRED / REQUESTING_PERMISSION Overlay */}
        {showPermissionOverlay && (
          <SensorPermissionPrompt
            onRequest={compass.requestPermissions}
            requesting={compass.compassStatus === 'REQUESTING_PERMISSION'}
            permissionDenied={compass.permissionDenied}
          />
        )}

        {/* UNAVAILABLE / ERROR Overlay */}
        {showUnavailableOverlay && (
          <SensorUnavailable
            mode={compass.compassStatus === 'ERROR' ? 'error' : 'unavailable'}
            onRetry={() => compass.requestPermissions()}
            onSimulate={() => {
              compass.setSimulatedHeading(343.0, 4, -3)
              showToast('Drag compass dial to rotate')
            }}
          />
        )}
      </motion.div>

      {/* Heading Readout (driven strictly by compassStatus & hasValidHeading) */}
      <div className="pb-2">
        <HeadingDisplay
          heading={compass.heading}
          precision={settings.compassPrecision}
          northMode={compass.northMode}
          lockedHeading={compass.lockedHeading}
          compassStatus={compass.compassStatus}
          hasValidHeading={compass.hasValidHeading}
        />
      </div>
    </InstrumentFrame>
  )
}
