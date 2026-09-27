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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider"
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

      {/* Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xs font-semibold tracking-[0.3em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          YOUR LOCATION
        </h1>
        <span
          className="text-[10px] font-mono tracking-widest"
          style={{
            color: coords
              ? '#22C55E'
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
          <div
            className="text-3xl font-light tracking-tight leading-snug font-mono"
            style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
          >
            <div>{formattedLat}</div>
            <div>{formattedLon}</div>
          </div>

          {/* Technical Instrument Telemetry Rows */}
          <div
            className="mt-6 pt-5 border-t flex flex-col gap-3.5"
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

          {/* Location Actions */}
          <div className="flex items-center gap-2.5 mt-6">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px] transition-colors"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              COPY
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px] transition-colors"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              SHARE
            </button>
            <button
              onClick={openSaveModal}
              className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px] transition-colors"
              style={{
                background: 'var(--accent)',
                color: '#000',
              }}
            >
              SAVE
            </button>
          </div>
        </div>
      ) : (
        /* Location Unavailable / Request State (PRD Section 55) */
        <div
          className="py-8 mb-8 border-y flex flex-col items-start gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <div
              className="text-xs font-semibold tracking-[0.25em] mb-1.5"
              style={{ color: 'var(--accent)' }}
            >
              LOCATION UNAVAILABLE
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {permissionState === 'denied'
                ? 'Location permission was denied. Enable location access in your browser settings or use reference coordinates.'
                : 'Enable location access to view live GPS telemetry and distance calculations.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full">
            <button
              onClick={requestLocation}
              className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => setManualCoords({ latitude: 28.6139, longitude: 77.209 })}
              className="px-5 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              USE REFERENCE (28.61°N, 77.21°E)
            </button>
            <button
              onClick={openSaveModal}
              className="px-5 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              + ADD WAYPOINT
            </button>
          </div>
        </div>
      )}

      {/* ─── SAVED LOCATIONS (Waypoints) ─────────────────────────────── */}
      <div className="mt-2 pt-6 border-t" style={{ borderColor: 'var(--border)' }} id="waypoints">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xs font-semibold tracking-[0.3em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            SAVED LOCATIONS
          </h2>
          <button
            onClick={openSaveModal}
            className="text-[11px] font-semibold tracking-widest min-h-[44px] px-2 flex items-center"
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
            className="w-full px-3.5 py-2.5 rounded-xl text-xs mb-4 outline-none"
            style={{
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        )}

        {filteredWaypoints.length === 0 ? (
          <div className="py-8 text-left">
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              No saved waypoints
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Your saved locations will appear here for offline bearing and distance navigation.
            </p>
            <button
              onClick={openSaveModal}
              className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              SAVE CURRENT LOCATION
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
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
                  className="w-full py-4 flex items-center justify-between text-left transition-opacity hover:opacity-85"
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
                    <div className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
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
              style={{ background: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavingModal(false)}
            />
            <motion.form
              onSubmit={handleCreateWaypoint}
              className="fixed inset-x-4 bottom-20 z-50 rounded-2xl p-5 max-w-sm mx-auto flex flex-col gap-3.5"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              <div className="text-xs font-semibold tracking-[0.25em]" style={{ color: 'var(--text-secondary)' }}>
                SAVE WAYPOINT
              </div>

              <div>
                <label className="text-[10px] tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={waypointName}
                  onChange={e => setWaypointName(e.target.value)}
                  placeholder="HOME, CAMP, TRAILHEAD…"
                  maxLength={48}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                    LATITUDE
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={waypointLatInput}
                    onChange={e => setWaypointLatInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                    LONGITUDE
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={waypointLonInput}
                    onChange={e => setWaypointLonInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
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
                  className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingModal(false)}
                  className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      {/* ─── Waypoint Detail Sheet (PRD Section 31) ──────────────────── */}
      <AnimatePresence>
        {selectedWaypoint && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWaypoint(null)}
            />
            <motion.div
              className="fixed inset-x-4 bottom-20 z-50 rounded-2xl p-5 max-w-sm mx-auto flex flex-col gap-4"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              {!isEditingWaypoint ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
                        WAYPOINT
                      </div>
                      <h3 className="text-lg font-semibold tracking-wider mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {selectedWaypoint.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedWaypoint(null)}
                      className="text-xs min-w-[44px] min-h-[44px] flex items-center justify-end"
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
                      className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{ background: 'var(--accent)', color: '#000' }}
                    >
                      NAVIGATE
                    </button>
                    <button
                      onClick={() => setIsEditingWaypoint(true)}
                      className="px-4 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-3 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{
                        background: 'rgba(239,68,68,0.14)',
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
                  <div className="text-xs font-semibold tracking-[0.25em]" style={{ color: 'var(--text-secondary)' }}>
                    EDIT WAYPOINT
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    maxLength={48}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editLat}
                      onChange={e => setEditLat(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editLon}
                      onChange={e => setEditLon(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{ background: 'var(--accent)', color: '#000' }}
                    >
                      UPDATE
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingWaypoint(false)}
                      className="flex-1 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[44px]"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
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
      <span className="text-[11px] font-semibold tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
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
