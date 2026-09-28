'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from '@/hooks/useLocation'
import { useCompass } from '@/hooks/useCompass'
import { useSettings } from '@/hooks/useSettings'
import { useWaypoints } from '@/hooks/useWaypoints'
import {
  formatDecimalCoord,
  formatDistance,
  formatAltitude,
  formatSpeed,
  distance,
  bearing,
  isValidCoordinates,
} from '@/lib/geo/GeoEngine'
import type { Waypoint } from '@/lib/storage/types'

export default function LocationPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const compass = useCompass()
  const {
    coords,
    altitude,
    accuracy,
    speed,
    heading: gpsHeading,
    timestamp,
    permissionState,
    requestLocation,
  } = useLocation(true)

  const { waypoints, addWaypoint, editWaypoint, removeWaypoint } = useWaypoints()

  // Fallback/manual reference coordinates if user wants to test without hardware GPS
  const [manualCoords, setManualCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const activeCoords = coords ?? manualCoords

  const [toast, setToast] = useState<string | null>(null)
  const [isSavingModal, setIsSavingModal] = useState(false)
  const [waypointName, setWaypointName] = useState('')
  const [waypointLatInput, setWaypointLatInput] = useState('')
  const [waypointLonInput, setWaypointLonInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null)
  const [isEditingWaypoint, setIsEditingWaypoint] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLon, setEditLon] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => {
      setToast(prev => (prev === msg ? null : prev))
    }, 2000)
  }

  const formattedLat = activeCoords ? formatDecimalCoord(activeCoords.latitude, true, 6) : null
  const formattedLon = activeCoords ? formatDecimalCoord(activeCoords.longitude, false, 6) : null

  const activeHeading =
    gpsHeading !== null && !Number.isNaN(gpsHeading)
      ? Math.round(gpsHeading)
      : Math.round(compass.heading)

  async function handleCopy() {
    if (!activeCoords) return
    const text = `${formatDecimalCoord(activeCoords.latitude, true, 6)}, ${formatDecimalCoord(activeCoords.longitude, false, 6)}`
    try {
      await navigator.clipboard.writeText(text)
      showToast('Coordinates copied')
    } catch {
      showToast(text)
    }
  }

  async function handleShare() {
    if (!activeCoords) return
    const text = `AXIS Location: ${formatDecimalCoord(activeCoords.latitude, true, 6)}, ${formatDecimalCoord(activeCoords.longitude, false, 6)}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'AXIS Coordinates', text })
        return
      } catch {
        // Fallback to copy if share cancelled/unsupported
      }
    }
    await handleCopy()
  }

  function openSaveModal() {
    setFormError(null)
    setWaypointName('')
    setWaypointLatInput(activeCoords ? activeCoords.latitude.toFixed(6) : '28.613900')
    setWaypointLonInput(activeCoords ? activeCoords.longitude.toFixed(6) : '77.209000')
    setIsSavingModal(true)
  }

  async function handleCreateWaypoint(e: React.FormEvent) {
    e.preventDefault()
    const lat = parseFloat(waypointLatInput)
    const lon = parseFloat(waypointLonInput)
    if (!isValidCoordinates(lat, lon)) {
      setFormError('Enter valid latitude (-90 to 90) and longitude (-180 to 180).')
      return
    }
    const name = waypointName.trim() || 'HOME'
    await addWaypoint(name, lat, lon, altitude)
    setIsSavingModal(false)
    showToast(`Saved ${name.toUpperCase()}`)
  }

  function openWaypointDetail(wp: Waypoint) {
    setSelectedWaypoint(wp)
    setIsEditingWaypoint(false)
    setEditName(wp.name)
    setEditLat(wp.latitude.toFixed(6))
    setEditLon(wp.longitude.toFixed(6))
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedWaypoint) return
    const lat = parseFloat(editLat)
    const lon = parseFloat(editLon)
    if (!isValidCoordinates(lat, lon)) return

    const updated = await editWaypoint(selectedWaypoint.id, {
      name: editName.trim() || selectedWaypoint.name,
      latitude: lat,
      longitude: lon,
    })
    if (updated) setSelectedWaypoint(updated)
    setIsEditingWaypoint(false)
    showToast('Waypoint updated')
  }

  async function handleDeleteSelected() {
    if (!selectedWaypoint) return
    const name = selectedWaypoint.name
    await removeWaypoint(selectedWaypoint.id)
    setSelectedWaypoint(null)
    showToast(`Deleted ${name}`)
  }

  const filteredWaypoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return waypoints
    return waypoints.filter(w => w.name.toLowerCase().includes(q))
  }, [waypoints, searchQuery])

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-8 max-w-md mx-auto w-full"
      style={{ color: 'var(--text-primary)' }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="instrument-panel fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-xs font-bold tracking-[0.28em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          YOUR LOCATION
        </h1>
        <span
          className="instrument-well px-2.5 py-1 rounded-full text-[10px] font-mono tracking-widest"
          style={{
            color: coords
              ? '#1E9E52'
              : manualCoords
              ? 'var(--accent)'
              : 'var(--text-muted)',
          }}
        >
          {coords ? '● GPS ACTIVE' : manualCoords ? '● REFERENCE' : '○ NO FIX'}
        </span>
      </div>

      {/* Primary Coordinate Readout */}
      {activeCoords ? (
        <div className="mb-7">
          <div className="instrument-panel rounded-2xl p-5">
            <div
              className="text-3xl font-light tracking-[-0.02em] leading-snug font-mono"
              style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              <div>{formattedLat}</div>
              <div>{formattedLon}</div>
            </div>

            {/* Technical Instrument Telemetry Rows */}
            <div
              className="mt-5 pt-4 border-t flex flex-col gap-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <TelemetryRow
                label="ALTITUDE"
                value={formatAltitude(altitude, settings.units)}
              />
              <TelemetryRow
                label="ACCURACY"
                value={
                  accuracy !== null
                    ? `±${settings.units === 'imperial' ? Math.round(accuracy * 3.28084) + ' ft' : Math.round(accuracy) + ' m'}`
                    : '—'
                }
              />
              <TelemetryRow
                label="SPEED"
                value={formatSpeed(speed, settings.units)}
              />
              <TelemetryRow
                label="HEADING"
                value={`${activeHeading}°`}
              />
              <TelemetryRow
                label="UPDATED"
                value={
                  timestamp
                    ? new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      })
                    : '—'
                }
              />
            </div>
          </div>

          {/* Location Actions */}
          <div className="flex items-center gap-2.5 mt-4">
            <button
              onClick={handleCopy}
              className="instrument-btn flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
              style={{ color: 'var(--text-primary)' }}
            >
              COPY
            </button>
            <button
              onClick={handleShare}
              className="instrument-btn flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
              style={{ color: 'var(--text-primary)' }}
            >
              SHARE
            </button>
            <button
              onClick={openSaveModal}
              className="instrument-btn instrument-btn-active flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
            >
              SAVE
            </button>
          </div>
        </div>
      ) : (
        /* Location Unavailable / Request State */
        <div className="instrument-panel rounded-2xl p-5 mb-7 flex flex-col items-start gap-4">
          <div>
            <div
              className="text-xs font-bold tracking-[0.25em] mb-1.5"
              style={{ color: 'var(--accent)' }}
            >
              LOCATION UNAVAILABLE
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {permissionState === 'denied'
                ? 'Location permission was denied. Enable location access in your browser settings or use reference coordinates.'
                : 'Enable location access to view live GPS telemetry and distance calculations.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full">
            <button
              onClick={requestLocation}
              className="instrument-btn instrument-btn-active px-5 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[42px]"
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => setManualCoords({ latitude: 28.6139, longitude: 77.209 })}
              className="instrument-btn px-4 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[42px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              USE REFERENCE (28.61°N, 77.21°E)
            </button>
            <button
              onClick={openSaveModal}
              className="instrument-btn px-4 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[42px]"
              style={{ color: 'var(--text-primary)' }}
            >
              + ADD WAYPOINT
            </button>
          </div>
        </div>
      )}

      {/* ─── SAVED LOCATIONS (Waypoints) ─────────────────────────────── */}
      <div className="mt-1 pt-5 border-t" style={{ borderColor: 'var(--border)' }} id="waypoints">
        <div className="flex items-center justify-between mb-3.5">
          <h2
            className="text-xs font-bold tracking-[0.28em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            SAVED LOCATIONS
          </h2>
          <button
            onClick={openSaveModal}
            className="instrument-btn px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.2em] min-h-[36px] flex items-center"
            style={{ color: 'var(--accent)' }}
          >
            + NEW
          </button>
        </div>

        {waypoints.length > 3 && (
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter saved locations…"
            className="instrument-well w-full px-3.5 py-2.5 rounded-xl text-xs mb-4 outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        )}

        {filteredWaypoints.length === 0 ? (
          <div className="instrument-panel rounded-2xl p-5 text-left">
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              No saved waypoints
            </div>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your saved locations will appear here for offline bearing and distance navigation.
            </p>
            <button
              onClick={openSaveModal}
              className="instrument-btn px-5 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[42px]"
              style={{ color: 'var(--text-primary)' }}
            >
              SAVE CURRENT LOCATION
            </button>
          </div>
        ) : (
          <div className="instrument-panel rounded-2xl overflow-hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {filteredWaypoints.map(wp => {
              const distMeters = activeCoords
                ? distance(activeCoords, { latitude: wp.latitude, longitude: wp.longitude })
                : null
              const brng = activeCoords
                ? Math.round(bearing(activeCoords, { latitude: wp.latitude, longitude: wp.longitude }))
                : null

              return (
                <button
                  key={wp.id}
                  onClick={() => openWaypointDetail(wp)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left transition-opacity active:opacity-80"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <div
                      className="text-sm font-semibold tracking-wider"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {wp.name}
                    </div>
                    <div
                      className="text-xs font-mono mt-1"
                      style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatDecimalCoord(wp.latitude, true, 4)} · {formatDecimalCoord(wp.longitude, false, 4)}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {distMeters !== null ? formatDistance(distMeters, settings.units) : '—'}
                    </div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      {brng !== null ? `${brng}°` : 'VIEW →'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Save Waypoint Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {isSavingModal && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavingModal(false)}
            />
            <motion.form
              onSubmit={handleCreateWaypoint}
              className="instrument-panel fixed inset-x-4 bottom-20 z-50 rounded-2xl p-5 max-w-sm mx-auto flex flex-col gap-3.5"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              <div className="text-xs font-bold tracking-[0.25em]" style={{ color: 'var(--text-secondary)' }}>
                SAVE WAYPOINT
              </div>

              <div>
                <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={waypointName}
                  onChange={e => setWaypointName(e.target.value)}
                  placeholder="HOME, CAMP, TRAILHEAD…"
                  maxLength={48}
                  className="instrument-well w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                    LATITUDE
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={waypointLatInput}
                    onChange={e => setWaypointLatInput(e.target.value)}
                    className="instrument-well w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                    LONGITUDE
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={waypointLonInput}
                    onChange={e => setWaypointLonInput(e.target.value)}
                    className="instrument-well w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs" style={{ color: '#EF4444' }}>
                  {formError}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="instrument-btn instrument-btn-active flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingModal(false)}
                  className="instrument-btn flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  CANCEL
                </button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      {/* ─── Waypoint Detail Sheet ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedWaypoint && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWaypoint(null)}
            />
            <motion.div
              className="instrument-panel fixed inset-x-4 bottom-20 z-50 rounded-2xl p-5 max-w-sm mx-auto flex flex-col gap-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              {!isEditingWaypoint ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
                        WAYPOINT
                      </div>
                      <h3 className="text-lg font-semibold tracking-wider mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {selectedWaypoint.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedWaypoint(null)}
                      className="text-xs min-w-[40px] min-h-[40px] flex items-center justify-end"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 text-xs border-y py-3.5" style={{ borderColor: 'var(--border)' }}>
                    <TelemetryRow
                      label="LATITUDE"
                      value={formatDecimalCoord(selectedWaypoint.latitude, true, 6)}
                    />
                    <TelemetryRow
                      label="LONGITUDE"
                      value={formatDecimalCoord(selectedWaypoint.longitude, false, 6)}
                    />
                    <TelemetryRow
                      label="ALTITUDE"
                      value={formatAltitude(selectedWaypoint.altitude, settings.units)}
                    />
                    <TelemetryRow
                      label="DISTANCE"
                      value={
                        activeCoords
                          ? formatDistance(
                              distance(activeCoords, {
                                latitude: selectedWaypoint.latitude,
                                longitude: selectedWaypoint.longitude,
                              }),
                              settings.units
                            )
                          : '—'
                      }
                    />
                    <TelemetryRow
                      label="BEARING"
                      value={
                        activeCoords
                          ? `${bearing(activeCoords, {
                              latitude: selectedWaypoint.latitude,
                              longitude: selectedWaypoint.longitude,
                            }).toFixed(1)}°`
                          : '—'
                      }
                    />
                    <TelemetryRow
                      label="SAVED"
                      value={new Date(selectedWaypoint.createdAt).toLocaleDateString()}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/tools/bearing?waypointId=${selectedWaypoint.id}`)}
                      className="instrument-btn instrument-btn-active flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                    >
                      NAVIGATE
                    </button>
                    <button
                      onClick={() => setIsEditingWaypoint(true)}
                      className="instrument-btn px-4 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        color: '#EF4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                  <div className="text-xs font-bold tracking-[0.25em]" style={{ color: 'var(--text-secondary)' }}>
                    EDIT WAYPOINT
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    maxLength={48}
                    className="instrument-well w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editLat}
                      onChange={e => setEditLat(e.target.value)}
                      className="instrument-well w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editLon}
                      onChange={e => setEditLon(e.target.value)}
                      className="instrument-well w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="submit"
                      className="instrument-btn instrument-btn-active flex-1 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                    >
                      UPDATE
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingWaypoint(false)}
                      className="instrument-btn flex-1 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TelemetryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span
        className="text-sm font-mono font-medium"
        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  )
}
