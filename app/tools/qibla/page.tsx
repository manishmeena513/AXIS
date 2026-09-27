'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import ToolHeader from '@/components/ui/ToolHeader'
import { useCompass } from '@/hooks/useCompass'
import { useLocation } from '@/hooks/useLocation'
import { useSettings } from '@/hooks/useSettings'
import {
  qiblaBearing,
  qiblaDistance,
  angleDifference,
  formatDistance,
  isValidCoordinates,
} from '@/lib/geo/GeoEngine'
import { haptic } from '@/lib/haptics/hapticEngine'

const QiblaInstrument = dynamic(() => import('@/components/3d/QiblaInstrument'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    />
  ),
})

export default function QiblaPage() {
  const { settings } = useSettings()
  const compass = useCompass()
  const { coords, requestLocation } = useLocation(true)

  const [manualLat, setManualLat] = useState('28.6139')
  const [manualLon, setManualLon] = useState('77.2090')
  const [showManual, setShowManual] = useState(false)

  const activePoint = useMemo(() => {
    if (coords && !showManual) return coords
    const lat = parseFloat(manualLat)
    const lon = parseFloat(manualLon)
    return isValidCoordinates(lat, lon) ? { latitude: lat, longitude: lon } : { latitude: 28.6139, longitude: 77.209 }
  }, [coords, showManual, manualLat, manualLon])

  const bearingToKaaba = useMemo(() => qiblaBearing(activePoint), [activePoint])
  const distToKaaba = useMemo(() => qiblaDistance(activePoint), [activePoint])

  const turnDiff = angleDifference(compass.heading, bearingToKaaba)
  const isAligned = Math.abs(turnDiff) < 2

  const wasAlignedRef = useRef(false)
  useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      haptic.aligned()
      wasAlignedRef.current = true
    } else if (!isAligned) {
      wasAlignedRef.current = false
    }
  }, [isAligned])

  const dragRef = useRef<{ x: number; startH: number } | null>(null)

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-4 pb-6 max-w-md mx-auto w-full justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader
        title="QIBLA"
        subtitle="Local Great-Circle Bearing to Makkah"
        rightSlot={
          <button
            onClick={() => {
              if (!coords) requestLocation()
              setShowManual(v => !v)
            }}
            className="text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full min-h-[40px]"
            style={{
              background: 'var(--surface-raised)',
              color: coords && !showManual ? '#22C55E' : 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            {coords && !showManual ? '● GPS' : 'MANUAL COORDS'}
          </button>
        }
      />

      {showManual && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[9px] tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
              YOUR LATITUDE
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={manualLat}
              onChange={e => setManualLat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <div>
            <label className="text-[9px] tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
              YOUR LONGITUDE
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={manualLon}
              onChange={e => setManualLon(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
        </div>
      )}

      {/* 3D Qibla Instrument */}
      <div
        className="relative w-full max-w-[270px] aspect-square mx-auto my-auto"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={e => {
          dragRef.current = { x: e.clientX, startH: compass.heading }
        }}
        onPointerMove={e => {
          if (!dragRef.current) return
          const dx = e.clientX - dragRef.current.x
          if (Math.abs(dx) > 4 && (!compass.sensorAvailable || compass.isSimulated)) {
            compass.setSimulatedHeading(dragRef.current.startH - dx * 0.6)
          }
        }}
        onPointerUp={() => {
          dragRef.current = null
        }}
      >
        <QiblaInstrument
          currentHeading={compass.heading}
          qiblaBearing={bearingToKaaba}
          tiltX={compass.tiltX}
          tiltY={compass.tiltY}
          motionMode={settings.motionMode}
        />
      </div>

      {/* Qibla Readout (Part I) */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
            QIBLA BEARING
          </div>
          <div
            className="text-5xl font-light tracking-tight leading-none mt-1"
            style={{
              color: isAligned ? 'var(--accent)' : 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(bearingToKaaba)}°
          </div>
        </div>

        <div
          className="w-full grid grid-cols-3 gap-2 py-3.5 px-4 rounded-2xl text-center"
          style={{
            background: 'var(--surface-raised)',
            border: `1px solid ${isAligned ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div>
            <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              QIBLA
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
              {bearingToKaaba.toFixed(1)}°
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              HEADING
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {compass.heading.toFixed(1)}°
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              {isAligned ? 'STATUS' : 'TURN'}
            </div>
            <div
              className="text-sm font-mono font-semibold mt-0.5"
              style={{ color: isAligned ? 'var(--accent)' : 'var(--text-primary)' }}
            >
              {isAligned ? 'ALIGNED' : `${turnDiff > 0 ? '→' : '←'} ${Math.abs(turnDiff).toFixed(1)}°`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full px-1 pt-1">
          <span className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
            DISTANCE TO MAKKAH
          </span>
          <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatDistance(distToKaaba, settings.units)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
