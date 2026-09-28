'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompass } from '@/hooks/useCompass'
import { useSensorPermission } from '@/hooks/useSensorPermission'
import { useSettings } from '@/hooks/useSettings'
import { useLocation } from '@/hooks/useLocation'
import InstrumentFrame from '@/components/ui/InstrumentFrame'
import HeadingDisplay from '@/components/compass/HeadingDisplay'
import SensorPermissionPrompt from '@/components/compass/SensorPermissionPrompt'
import SensorUnavailable from '@/components/compass/SensorUnavailable'
import CalibrationPrompt from '@/components/compass/CalibrationPrompt'
import DesktopFallback from '@/components/compass/DesktopFallback'
import { haptic } from '@/lib/haptics/hapticEngine'
import { shortestAngularDiff } from '@/lib/compass/CompassEngine'

// Lazy-load Three.js scene while showing the 3D instrument shell immediately
const CompassScene = dynamic(() => import('@/components/3d/CompassScene'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-full flex items-center justify-center relative"
      style={{
        background: 'radial-gradient(circle at 35% 30%, #1c1c1a, #0c0c0b 75%)',
        border: '2px solid var(--border)',
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
  const { status, requesting, requestPermissions } = useSensorPermission()
  const { requestLocation } = useLocation(false)

  const [calibrating, setCalibrating] = useState(false)
  const [dismissedFallback, setDismissedFallback] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => {
      setToast(prev => (prev === msg ? null : prev))
    }, 1800)
  }, [])

  // Cardinal crossing haptic (N=0, E=90, S=180, W=270)
  const lastCardinalRef = useRef<number | null>(null)
  useEffect(() => {
    const nearestCardinal = (Math.round(compass.heading / 90) * 90) % 360
    const distToCardinal = Math.abs(shortestAngularDiff(compass.heading, nearestCardinal))
    if (distToCardinal < 1.2) {
      if (lastCardinalRef.current !== null && lastCardinalRef.current !== nearestCardinal) {
        haptic.cardinalCross()
      }
      lastCardinalRef.current = nearestCardinal
    }
  }, [compass.heading])

  // Alignment haptic when locked heading is reached
  const wasAlignedRef = useRef(false)
  useEffect(() => {
    if (compass.lockedHeading === null) {
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
  }, [compass.heading, compass.lockedHeading])

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

  // Gestures on Compass Instrument (Tap, Double-Tap, Long-Press, and Desktop Drag)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; startHeading: number; moved: boolean } | null>(null)
  const dialContainerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startHeading: compass.heading,
        moved: false,
      }
      longPressRef.current = setTimeout(() => {
        if (dragStartRef.current && !dragStartRef.current.moved) {
          setCalibrating(true)
          haptic.lockAchieved()
        }
      }, 600)
    },
    [compass.heading]
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
        // When hardware sensors aren't active or in simulated mode, allow smooth dial rotation + tilt parallax
        if (!compass.sensorAvailable || compass.isSimulated) {
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
    if (wasDragged) return

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
  }, [compass, handleToggleNorthMode, showToast])

  const needsPermission = status === 'prompt'
  const isDenied = status === 'denied'
  const showDesktopFallback =
    !needsPermission &&
    !isDenied &&
    !compass.sensorAvailable &&
    !compass.isSimulated &&
    !dismissedFallback

  return (
    <InstrumentFrame className="h-full justify-between py-3 px-4">
      {/* Minimal Top Controls Bar */}
      <div className="w-full flex justify-end items-center z-10">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleNorthMode}
            className="text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full min-h-[44px] flex items-center transition-colors"
            style={{
              background: 'var(--surface-raised)',
              color: compass.northMode === 'true' ? 'var(--accent)' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
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
            className="text-[10px] font-semibold tracking-widest px-3.5 py-1.5 rounded-full min-h-[44px] flex items-center transition-all"
            style={{
              background: compass.lockedHeading !== null ? 'var(--accent)' : 'var(--surface-raised)',
              color: compass.lockedHeading !== null ? '#000' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {compass.lockedHeading !== null ? 'LOCKED' : 'LOCK'}
          </button>

          <button
            onClick={() => setCalibrating(true)}
            className="text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full min-h-[44px] flex items-center"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            aria-label="Calibrate compass"
          >
            CAL
          </button>
        </div>
      </div>

      {/* Toast Notification for Tap / Double-Tap gestures */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-16 z-40 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3D Compass Instrument */}
      <motion.div
        ref={dialContainerRef}
        className="relative w-full max-w-[320px] aspect-square my-auto flex items-center justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none', cursor: !compass.sensorAvailable || compass.isSimulated ? 'grab' : 'pointer' }}
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{
          opacity: calibrating ? 0.55 : 1,
          scale: 1,
          y: 0,
        }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <CompassScene
          heading={compass.heading}
          tiltX={compass.tiltX}
          tiltY={compass.tiltY}
          lockedHeading={compass.lockedHeading}
          motionMode={settings.motionMode}
          batteryMode={settings.batteryMode}
        />

        {/* Calibration Figure-8 Overlay */}
        <CalibrationPrompt
          isOpen={calibrating}
          progress={compass.calibrationProgress}
          onComplete={() => compass.markCalibrated()}
          onClose={() => setCalibrating(false)}
        />

        {/* Browser Sensor Permission Prompt */}
        {needsPermission && (
          <SensorPermissionPrompt
            onRequest={requestPermissions}
            requesting={requesting}
          />
        )}

        {/* Permission Denied Overlay */}
        {isDenied && (
          <SensorUnavailable onRetry={() => requestPermissions()} />
        )}
      </motion.div>

      {/* Desktop Fallback Banner */}
      {showDesktopFallback && (
        <div className="mb-2 z-20">
          <DesktopFallback
            onSimulate={() => {
              setDismissedFallback(true)
              compass.setSimulatedHeading(327.4, 4, -3)
              showToast('Drag compass dial to rotate')
            }}
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {/* Heading Readout */}
      <div className="pb-1">
        <HeadingDisplay
          heading={compass.heading}
          precision={settings.compassPrecision}
          northMode={compass.northMode}
          lockedHeading={compass.lockedHeading}
        />
      </div>
    </InstrumentFrame>
  )
}
