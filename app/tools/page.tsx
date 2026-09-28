'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

type ToolIconId = 'bearing' | 'waypoints' | 'coordinates' | 'level' | 'qibla' | 'sun' | 'moon'

function ToolIcon({ id }: { id: ToolIconId }) {
  switch (id) {
    case 'bearing':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7l3.5 9.5L12 14.5l-3.5 2L12 7z" />
        </svg>
      )
    case 'waypoints':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      )
    case 'coordinates':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" />
        </svg>
      )
    case 'level':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      )
    case 'qibla':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3L19 10l-7 11L5 10 12 3z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      )
    case 'sun':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
        </svg>
      )
    case 'moon':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a8.5 8.5 0 1 0 10.9 10.9z" />
        </svg>
      )
  }
}

const TOOL_GROUPS: ReadonlyArray<{
  group: string
  items: ReadonlyArray<{ href: string; icon: ToolIconId; label: string; desc: string }>
}> = [
  {
    group: 'NAVIGATION',
    items: [
      { href: '/tools/bearing',      icon: 'bearing',     label: 'Bearing & Distance', desc: 'Great-circle bearing, turn guidance & distance' },
      { href: '/location#waypoints', icon: 'waypoints',   label: 'Waypoints',          desc: 'Saved offline locations & target navigation' },
      { href: '/tools/coordinates',  icon: 'coordinates', label: 'Coordinates',        desc: 'Decimal, DMS & DM coordinate conversion' },
    ],
  },
  {
    group: 'INSTRUMENTS',
    items: [
      { href: '/tools/level', icon: 'level', label: 'Level & Inclinometer', desc: 'Precision 3D spirit bubble & surface clinometer' },
    ],
  },
  {
    group: 'DIRECTION',
    items: [
      { href: '/tools/qibla', icon: 'qibla', label: 'Qibla', desc: 'Local great-circle bearing & distance to Makkah' },
    ],
  },
  {
    group: 'ASTRONOMY',
    items: [
      { href: '/tools/sun',  icon: 'sun',  label: 'Sun',  desc: 'Solar azimuth, altitude, sunrise & golden hour' },
      { href: '/tools/moon', icon: 'moon', label: 'Moon', desc: '3D lunar phase, illumination, rise & set' },
    ],
  },
]

export default function ToolsPage() {
  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-8 max-w-md mx-auto w-full select-none"
      style={{ color: 'var(--text-primary)' }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xs font-bold tracking-[0.28em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          INSTRUMENT SUITE
        </h1>
        <span
          className="text-[10px] font-mono tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          7 MODULES
        </span>
      </div>

      {TOOL_GROUPS.map(({ group, items }) => (
        <section key={group} className="mb-6">
          <h2
            className="text-[10px] font-bold tracking-[0.28em] mb-2.5 px-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {group}
          </h2>
          <div
            className="instrument-panel rounded-2xl overflow-hidden divide-y"
            style={{ borderColor: 'var(--border)' }}
          >
            {items.map(({ href, icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-80"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent)',
                    }}
                  >
                    <ToolIcon id={icon} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-wide truncate" style={{ color: 'var(--text-primary)' }}>
                      {label}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {desc}
                    </div>
                  </div>
                </div>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </motion.div>
  )
}
