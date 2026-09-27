'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const TOOL_GROUPS = [
  {
    group: 'NAVIGATION',
    items: [
      { href: '/tools/bearing',      label: 'Bearing & Distance', desc: 'Great-circle bearing, turn guidance & distance' },
      { href: '/location#waypoints', label: 'Waypoints',          desc: 'Saved offline locations & target navigation' },
      { href: '/tools/coordinates',  label: 'Coordinates',        desc: 'Decimal, DMS & DM coordinate conversion' },
    ],
  },
  {
    group: 'INSTRUMENTS',
    items: [
      { href: '/tools/level', label: 'Level & Inclinometer', desc: 'Precision 3D glass bubble spirit level' },
    ],
  },
  {
    group: 'DIRECTION',
    items: [
      { href: '/tools/qibla', label: 'Qibla', desc: 'Local great-circle bearing & distance to Makkah' },
    ],
  },
  {
    group: 'ASTRONOMY',
    items: [
      { href: '/tools/sun',  label: 'Sun',  desc: 'Solar azimuth, altitude, sunrise & golden hour' },
      { href: '/tools/moon', label: 'Moon', desc: '3D lunar phase, illumination, rise & set' },
    ],
  },
] as const

export default function ToolsPage() {
  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-8 max-w-md mx-auto w-full select-none"
      style={{ color: 'var(--text-primary)' }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1
        className="text-xs font-semibold tracking-[0.3em] mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        TOOLS
      </h1>

      {TOOL_GROUPS.map(({ group, items }) => (
        <section key={group} className="mb-7">
          <h2
            className="text-[10px] font-semibold tracking-[0.3em] mb-2.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {group}
          </h2>
          <div className="flex flex-col divide-y border-y" style={{ borderColor: 'var(--border)' }}>
            {items.map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between py-4 transition-opacity hover:opacity-80"
              >
                <div>
                  <div className="text-sm font-medium tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {desc}
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
