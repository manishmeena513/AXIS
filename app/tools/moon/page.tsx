'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import ToolHeader from '@/components/ui/ToolHeader'
import { useLocation } from '@/hooks/useLocation'
import {
  getLunarData,
  formatTimeHHMM,
} from '@/lib/astronomy/AstronomyEngine'

const MoonScene = dynamic(() => import('@/components/3d/MoonScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
})

export default function MoonPage() {
  const { coords } = useLocation(true)
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const activeCoords = coords ?? { latitude: 28.6139, longitude: 77.209 }

  const lunar = useMemo(
    () => getLunarData(now, activeCoords.latitude, activeCoords.longitude),
    [now, activeCoords.latitude, activeCoords.longitude]
  )

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-4 pb-6 max-w-md mx-auto w-full justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader title="MOON" subtitle="Lunar Phase, Illumination & Ephemeris" />

      {/* 3D Phase-Lit Moon */}
      <div className="w-full h-52 my-auto">
        <MoonScene phase={lunar.phase} />
      </div>

      {/* Phase Name & Illumination Header */}
      <div className="flex flex-col items-center text-center my-2">
        <div
          className="text-xs font-bold tracking-[0.28em]"
          style={{ color: 'var(--accent)' }}
        >
          {lunar.phaseName}
        </div>
        <div
          className="text-4xl font-light font-mono mt-1 tracking-[-0.02em]"
          style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
        >
          {lunar.percent}%
        </div>
        <div className="text-[10px] font-bold tracking-[0.24em] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          ILLUMINATION
        </div>
      </div>

      {/* Lunar Telemetry & Rise/Set Times */}
      <div className="instrument-panel rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
        <DataRow label="AZIMUTH" value={`${Math.round(lunar.azimuth)}°`} />
        <DataRow
          label="ALTITUDE"
          value={`${lunar.altitude >= 0 ? '+' : ''}${Math.round(lunar.altitude)}°`}
        />
        <DataRow label="MOONRISE" value={formatTimeHHMM(lunar.moonrise)} />
        <DataRow label="MOONSET" value={formatTimeHHMM(lunar.moonset)} />
        <DataRow label="DISTANCE" value={`${lunar.distanceKm.toLocaleString()} km`} />
      </div>
    </motion.div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
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
