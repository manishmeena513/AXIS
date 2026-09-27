'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import ToolHeader from '@/components/ui/ToolHeader'
import { useCompass } from '@/hooks/useCompass'
import { useLocation } from '@/hooks/useLocation'
import { useWaypoints } from '@/hooks/useWaypoints'
import { useSettings } from '@/hooks/useSettings'
import {
  bearing,
  distance,
  angleDifference,
  formatDistance,
  isValidCoordinates,
} from '@/lib/geo/GeoEngine'
import { haptic } from '@/lib/haptics/hapticEngine'

const BearingInstrument = dynamic(() => import('@/components/3d/BearingInstrument'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    />
  ),
})

export default function BearingPage() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <BearingPageContent />
    </Suspense>
  )
}

function BearingPageContent() {
  const searchParams = useSearchParams()
  const initialWaypointId = searchParams.get('waypointId')

  const { settings } = useSettings()
  const compass = useCompass()
  const { coords } = useLocation(true)
  const { waypoints } = useWaypoints()

  const [mode, setMode] = useState<'waypoint' | 'manual'>('manual')
  const [selectedWpId, setSelectedWpId] = useState<string>('')

  // Origin coordinates (GPS or fallback reference)
  const [originLat, setOriginLat] = useState('28.613900')
  const [originLon, setOriginLon] = useState('77.209000')
  const [hasSyncedOrigin, setHasSyncedOrigin] = useState(false)

  // Destination coordinates
  const [destLat, setDestLat] = useState('28.630400')
  const [destLon, setDestLon] = useState('77.217700')

  useEffect(() => {
    if (coords && !hasSyncedOrigin) {
      setOriginLat(coords.latitude.toFixed(6))
      setOriginLon(coords.longitude.toFixed(6))
      setHasSyncedOrigin(true)
    }
  }, [coords, hasSyncedOrigin])

  useEffect(() => {
    if (initialWaypointId && waypoints.length > 0) {
      const found = waypoints.find(w => w.id === initialWaypointId)
      if (found) {
        setMode('waypoint')
        setSelectedWpId(found.id)
        setDestLat(found.latitude.toFixed(6))
        setDestLon(found.longitude.toFixed(6))
      }
    } else if (waypoints.length > 0 && !selectedWpId) {
      setSelectedWpId(waypoints[0].id)
    }
  }, [initialWaypointId, waypoints, selectedWpId])

  function handleSelectWaypoint(id: string) {
    setSelectedWpId(id)
    const found = waypoints.find(w => w.id === id)
    if (found) {
      setDestLat(found.latitude.toFixed(6))
      setDestLon(found.longitude.toFixed(6))
    }
  }

  const originPoint = useMemo(() => {
    if (coords) return coords
    const lat = parseFloat(originLat)
    const lon = parseFloat(originLon)
    return isValidCoordinates(lat, lon) ? { latitude: lat, longitude: lon } : null
  }, [coords, originLat, originLon])

  const destPoint = useMemo(() => {
    if (mode === 'waypoint') {
      const wp = waypoints.find(w => w.id === selectedWpId)
      if (wp) return { latitude: wp.latitude, longitude: wp.longitude }
    }
    const lat = parseFloat(destLat)
    const lon = parseFloat(destLon)
    return isValidCoordinates(lat, lon) ? { latitude: lat, longitude: lon } : null
  }, [mode, waypoints, selectedWpId, destLat, destLon])

  const targetBearing = useMemo(() => {
    if (!originPoint || !destPoint) return 0
    return bearing(originPoint, destPoint)
  }, [originPoint, destPoint])

  const targetDistance = useMemo(() => {
    if (!originPoint || !destPoint) return null
    return distance(originPoint, destPoint)
  }, [originPoint, destPoint])

  const turnDiff = angleDifference(compass.heading, targetBearing)
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

  // Allow desktop drag simulation on the instrument dial
  const dragRef = useRef<{ x: number; startH: number } | null>(null)

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-4 pb-6 max-w-md mx-auto w-full justify-between"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader title="BEARING" subtitle="Target Direction & Great-Circle Distance" />

      {/* Target Mode Selector */}
      <div className="flex flex-col gap-2.5 mb-3">
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setMode('manual')}
            className="flex-1 py-2 text-[11px] font-semibold tracking-wider min-h-[40px]"
            style={{
              background: mode === 'manual' ? 'var(--accent)' : 'transparent',
              color: mode === 'manual' ? '#000' : 'var(--text-secondary)',
            }}
          >
            COORDINATES
          </button>
          <button
            onClick={() => setMode('waypoint')}
            className="flex-1 py-2 text-[11px] font-semibold tracking-wider min-h-[40px]"
            style={{
              background: mode === 'waypoint' ? 'var(--accent)' : 'transparent',
              color: mode === 'waypoint' ? '#000' : 'var(--text-secondary)',
            }}
          >
            SAVED WAYPOINT ({waypoints.length})
          </button>
        </div>

        {mode === 'waypoint' ? (
          waypoints.length > 0 ? (
            <select
              value={selectedWpId}
              onChange={e => handleSelectWaypoint(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {waypoints.map(wp => (
                <option key={wp.id} value={wp.id}>
                  {wp.name} ({wp.latitude.toFixed(4)}°, {wp.longitude.toFixed(4)}°)
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs py-1" style={{ color: 'var(--text-secondary)' }}>
              No saved waypoints yet. Save a location on the Location tab or enter coordinates.
            </p>
          )
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                TARGET LAT
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={destLat}
                onChange={e => setDestLat(e.target.value)}
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
                TARGET LON
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={destLon}
                onChange={e => setDestLon(e.target.value)}
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
      </div>

      {/* 3D Bearing Instrument */}
      <div
        className="relative w-full max-w-[240px] aspect-square mx-auto my-1"
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
        <BearingInstrument
          currentHeading={compass.heading}
          targetBearing={targetBearing}
          tiltX={compass.tiltX}
          tiltY={compass.tiltY}
          motionMode={settings.motionMode}
        />
      </div>

      {/* Bearing & Distance Readout (Parts D, E, F) */}
      <div className="flex flex-col items-center gap-3 mt-1 select-none">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
            BEARING
          </div>
          <div
            className="text-5xl font-light tracking-tight leading-none mt-1"
            style={{
              color: isAligned ? 'var(--accent)' : 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {targetBearing.toFixed(1)}°
          </div>
        </div>

        <div
          className="w-full grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl text-center"
          style={{
            background: 'var(--surface-raised)',
            border: `1px solid ${isAligned ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div>
            <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              TARGET
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
              {targetBearing.toFixed(1)}°
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              CURRENT
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {compass.heading.toFixed(1)}°
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              {isAligned ? 'STATUS' : turnDiff > 0 ? 'TURN RIGHT' : 'TURN LEFT'}
            </div>
            <div
              className="text-sm font-mono font-semibold mt-0.5"
              style={{ color: isAligned ? 'var(--accent)' : 'var(--text-primary)' }}
            >
              {isAligned ? 'ALIGNED' : `${turnDiff > 0 ? '→' : '←'} ${Math.abs(turnDiff).toFixed(1)}°`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full px-1 text-xs">
          <span className="tracking-[0.25em] text-[10px]" style={{ color: 'var(--text-muted)' }}>
            DISTANCE
          </span>
          <span className="font-mono font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            {targetDistance !== null ? formatDistance(targetDistance, settings.units) : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
