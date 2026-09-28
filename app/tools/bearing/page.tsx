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

  const [originLat, setOriginLat] = useState('28.613900')
  const [originLon, setOriginLon] = useState('77.209000')
  const [hasSyncedOrigin, setHasSyncedOrigin] = useState(false)

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

  const dragRef = useRef<{ x: number; startH: number } | null>(null)

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-3 pb-5 max-w-md mx-auto w-full justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader title="BEARING" subtitle="Target Azimuth & Great-Circle Distance" />

      {/* Precision Navigation Control Panel Selector (Section 8) */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="instrument-well flex p-0.5 gap-1">
          <button
            onClick={() => setMode('manual')}
            className={`${
              mode === 'manual' ? 'instrument-btn-active' : 'text-[var(--text-secondary)]'
            } flex-1 py-1.5 text-[10px] font-mono font-semibold tracking-[0.16em] min-h-[34px] transition-all`}
          >
            COORDINATES
          </button>
          <button
            onClick={() => setMode('waypoint')}
            className={`${
              mode === 'waypoint' ? 'instrument-btn-active' : 'text-[var(--text-secondary)]'
            } flex-1 py-1.5 text-[10px] font-mono font-semibold tracking-[0.16em] min-h-[34px] transition-all`}
          >
            SAVED WAYPOINT ({waypoints.length})
          </button>
        </div>

        {mode === 'waypoint' ? (
          waypoints.length > 0 ? (
            <select
              value={selectedWpId}
              onChange={e => handleSelectWaypoint(e.target.value)}
              className="instrument-well w-full px-3 py-2 text-xs font-mono outline-none"
              style={{ color: 'var(--text-primary)' }}
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
              <label className="text-[9px] font-semibold tracking-[0.18em] block mb-1" style={{ color: 'var(--text-muted)' }}>
                TARGET LAT
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={destLat}
                onChange={e => setDestLat(e.target.value)}
                className="instrument-well w-full px-3 py-1.5 text-xs font-mono outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold tracking-[0.18em] block mb-1" style={{ color: 'var(--text-muted)' }}>
                TARGET LON
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={destLon}
                onChange={e => setDestLon(e.target.value)}
                className="instrument-well w-full px-3 py-1.5 text-xs font-mono outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3D Bearing Instrument grounded in physical dial shell */}
      <div
        className="instrument-dial-shell relative w-full max-w-[238px] aspect-square mx-auto my-1"
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

      {/* Bearing & Distance Readout */}
      <div className="flex flex-col items-center gap-2.5 mt-1 select-none">
        <div className="text-center">
          <div className="text-[10px] font-semibold tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
            BEARING
          </div>
          <div
            className="text-5xl font-light font-mono tracking-[-0.03em] leading-none mt-0.5"
            style={{
              color: isAligned ? 'var(--accent)' : 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {targetBearing.toFixed(1)}°
          </div>
        </div>

        <div
          className="instrument-panel w-full grid grid-cols-3 divide-x py-3 px-4 text-center"
          style={{
            borderColor: isAligned ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div className="pr-2" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              TARGET
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
              {targetBearing.toFixed(1)}°
            </div>
          </div>

          <div className="px-2" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              CURRENT
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {compass.heading.toFixed(1)}°
            </div>
          </div>

          <div className="pl-2" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
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
          <span className="font-semibold tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>
            DISTANCE
          </span>
          <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {targetDistance !== null ? formatDistance(targetDistance, settings.units) : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
