'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ToolHeader from '@/components/ui/ToolHeader'
import { useLocation } from '@/hooks/useLocation'
import {
  coordinateConversion,
  parseCoordinateString,
} from '@/lib/geo/GeoEngine'

export default function CoordinatesPage() {
  const { coords, requestLocation } = useLocation(true)

  const [latInput, setLatInput] = useState('28.613900° N')
  const [lonInput, setLonInput] = useState('77.209000° E')
  const [hasSyncedGps, setHasSyncedGps] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (coords && !hasSyncedGps) {
      const conv = coordinateConversion(coords.latitude, coords.longitude)
      setLatInput(conv.decimal.lat)
      setLonInput(conv.decimal.lon)
      setHasSyncedGps(true)
    }
  }, [coords, hasSyncedGps])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => {
      setToast(prev => (prev === msg ? null : prev))
    }, 1800)
  }

  const parsedLat = parseCoordinateString(latInput, true)
  const parsedLon = parseCoordinateString(lonInput, false)
  const isValid = parsedLat !== null && parsedLon !== null

  const converted = isValid
    ? coordinateConversion(parsedLat, parsedLon)
    : null

  function handleUseCurrentGps() {
    if (coords) {
      const conv = coordinateConversion(coords.latitude, coords.longitude)
      setLatInput(conv.decimal.lat)
      setLonInput(conv.decimal.lon)
      showToast('Updated from GPS')
    } else {
      requestLocation()
      showToast('Requesting GPS…')
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      showToast(`Copied ${label}`)
    } catch {
      showToast(value)
    }
  }

  async function shareText(value: string) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'AXIS Coordinates', text: value })
        return
      } catch {
        // Fallback to copy
      }
    }
    await copyText('coordinates', value)
  }

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-4 pb-8 max-w-md mx-auto w-full"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader
        title="COORDINATES"
        subtitle="Decimal · DMS · DM Converter"
        rightSlot={
          <button
            onClick={handleUseCurrentGps}
            className="text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full min-h-[40px]"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            USE GPS
          </button>
        }
      />

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

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-1 gap-3 mt-2 mb-6">
        <div>
          <label
            className="text-[10px] font-semibold tracking-[0.25em] block mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            LATITUDE (DECIMAL, DMS, OR DM)
          </label>
          <input
            type="text"
            value={latInput}
            onChange={e => setLatInput(e.target.value)}
            placeholder="e.g. 28.613900° N or 28°36'50.04&quot;N"
            className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              border: `1px solid ${parsedLat === null ? '#EF4444' : 'var(--border)'}`,
            }}
          />
        </div>

        <div>
          <label
            className="text-[10px] font-semibold tracking-[0.25em] block mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            LONGITUDE (DECIMAL, DMS, OR DM)
          </label>
          <input
            type="text"
            value={lonInput}
            onChange={e => setLonInput(e.target.value)}
            placeholder="e.g. 77.209000° E or 77°12'32.40&quot;E"
            className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              border: `1px solid ${parsedLon === null ? '#EF4444' : 'var(--border)'}`,
            }}
          />
        </div>

        {!isValid && (
          <p className="text-xs" style={{ color: '#EF4444' }}>
            Enter a valid latitude (-90° to 90°) and longitude (-180° to 180°).
          </p>
        )}
      </div>

      {/* Converted Formats */}
      {converted && (
        <div className="flex flex-col divide-y border-t border-b" style={{ borderColor: 'var(--border)' }}>
          <FormatBlock
            title="DECIMAL DEGREES (DD)"
            lat={converted.decimal.lat}
            lon={converted.decimal.lon}
            onCopy={() => copyText('Decimal', converted.decimal.full)}
            onShare={() => shareText(converted.decimal.full)}
          />
          <FormatBlock
            title="DEGREES MINUTES SECONDS (DMS)"
            lat={converted.dms.lat}
            lon={converted.dms.lon}
            onCopy={() => copyText('DMS', converted.dms.full)}
            onShare={() => shareText(converted.dms.full)}
          />
          <FormatBlock
            title="DEGREES DECIMAL MINUTES (DM)"
            lat={converted.dm.lat}
            lon={converted.dm.lon}
            onCopy={() => copyText('DM', converted.dm.full)}
            onShare={() => shareText(converted.dm.full)}
          />
        </div>
      )}
    </motion.div>
  )
}

function FormatBlock({
  title,
  lat,
  lon,
  onCopy,
  onShare,
}: {
  title: string
  lat: string
  lon: string
  onCopy: () => void
  onShare: () => void
}) {
  return (
    <div className="py-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onCopy}
            className="text-[11px] font-semibold tracking-widest min-h-[36px] px-2"
            style={{ color: 'var(--accent)' }}
          >
            COPY
          </button>
          <button
            onClick={onShare}
            className="text-[11px] font-semibold tracking-widest min-h-[36px] px-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            SHARE
          </button>
        </div>
      </div>
      <div
        className="text-xl font-mono tracking-tight"
        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        <div>{lat}</div>
        <div>{lon}</div>
      </div>
    </div>
  )
}
