'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import ToolHeader from '@/components/ui/ToolHeader'
import { useLocation } from '@/hooks/useLocation'
import {
  getSolarData,
  formatTimeHHMM,
  formatDurationHM,
} from '@/lib/astronomy/AstronomyEngine'

const SunScene = dynamic(() => import('@/components/3d/SunScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
})

export default function SunPage() {
  const { coords } = useLocation(true)
  const [now, setNow] = useState<Date>(() => new Date())

  // Update astronomical calculations once per minute (never per animation frame)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const activeCoords = coords ?? { latitude: 28.6139, longitude: 77.209 }

  const solar = useMemo(
    () => getSolarData(now, activeCoords.latitude, activeCoords.longitude),
    [now, activeCoords.latitude, activeCoords.longitude]
  )

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-4 pb-6 max-w-md mx-auto w-full justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader
        title="SUN"
        subtitle="Local Solar Position & Ephemeris"
        rightSlot={
          <span
            className="text-[10px] font-mono tracking-widest"
            style={{ color: solar.isDaylight ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {solar.isDaylight ? '● DAYLIGHT' : '○ NIGHT'}
          </span>
        }
      />

      {/* 3D Solar Arc Visualization */}
      <div className="w-full h-56 my-auto">
        <SunScene
          azimuth={solar.azimuth}
          altitude={solar.altitude}
          isDaylight={solar.isDaylight}
        />
      </div>

      {/* Primary Solar Azimuth & Altitude */}
      <div className="grid grid-cols-2 gap-4 my-3 text-center">
        <div
          className="py-3.5 px-4 rounded-2xl"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        >
          <div className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
            AZIMUTH
          </div>
          <div
            className="text-3xl font-light font-mono mt-1"
            style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
          >
            {Math.round(solar.azimuth)}°
          </div>
        </div>

        <div
          className="py-3.5 px-4 rounded-2xl"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        >
          <div className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
            ALTITUDE
          </div>
          <div
            className="text-3xl font-light font-mono mt-1"
            style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}
          >
            {solar.altitude >= 0 ? '+' : ''}
            {Math.round(solar.altitude)}°
          </div>
        </div>
      </div>

      {/* Key Solar Times (Part K) */}
      <div
        className="flex flex-col gap-3 pt-4 border-t text-xs"
        style={{ borderColor: 'var(--border)' }}
      >
        <DataRow label="SUNRISE" value={formatTimeHHMM(solar.sunrise)} />
        <DataRow label="SOLAR NOON" value={formatTimeHHMM(solar.solarNoon)} />
        <DataRow label="SUNSET" value={formatTimeHHMM(solar.sunset)} />
        <DataRow
          label="GOLDEN HOUR"
          value={`${formatTimeHHMM(solar.goldenHourEveningStart)} – ${formatTimeHHMM(solar.sunset)}`}
        />
        <DataRow
          label="DAYLIGHT DURATION"
          value={formatDurationHM(solar.daylightMinutes)}
        />
        <DataRow
          label="DAYLIGHT REMAINING"
          value={solar.daylightRemainingMinutes > 0 ? formatDurationHM(solar.daylightRemainingMinutes) : '0h 00m'}
        />
      </div>
    </motion.div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
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
