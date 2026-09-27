'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { useWaypoints } from '@/hooks/useWaypoints'
import { CompassEngine } from '@/lib/compass/CompassEngine'
import { DEFAULT_SETTINGS, type Settings } from '@/lib/storage/types'

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const { theme, setTheme } = useTheme()
  const { waypoints, clearAll } = useWaypoints()
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearedMsg, setClearedMsg] = useState(false)

  async function handleClearAllData() {
    await clearAll()
    update(DEFAULT_SETTINGS)
    setTheme(DEFAULT_SETTINGS.theme)
    setConfirmClear(false)
    setClearedMsg(true)
    setTimeout(() => setClearedMsg(false), 2200)
  }

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
        SETTINGS
      </h1>

      <section className="mb-7">
        <SectionLabel>APPEARANCE</SectionLabel>
        <SegmentControl
          options={[
            { label: 'Dark',   value: 'dark'   },
            { label: 'Light',  value: 'light'  },
            { label: 'System', value: 'system' },
          ]}
          value={theme}
          onChange={v => setTheme(v as Settings['theme'])}
        />
      </section>

      <section className="mb-7">
        <SectionLabel>UNITS</SectionLabel>
        <SegmentControl
          options={[
            { label: 'Metric',   value: 'metric'   },
            { label: 'Imperial', value: 'imperial' },
          ]}
          value={settings.units}
          onChange={v => update({ units: v as Settings['units'] })}
        />
      </section>

      <section className="mb-7">
        <SectionLabel>COMPASS</SectionLabel>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="True North"
            desc="Apply local magnetic declination"
            value={settings.northMode === 'true'}
            onChange={v => {
              const mode = v ? 'true' : 'magnetic'
              update({ northMode: mode })
              CompassEngine.setNorthMode(mode)
            }}
          />
          <ToggleRow
            label="1 decimal place"
            desc="e.g. 327.4°"
            value={settings.compassPrecision === 1}
            onChange={v => update({ compassPrecision: v ? 1 : 0 })}
          />
        </div>
      </section>

      <section className="mb-7">
        <SectionLabel>FEEDBACK</SectionLabel>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Haptics"
            desc="Tactile vibration on alignment & cardinal marks"
            value={settings.haptics}
            onChange={v => update({ haptics: v })}
          />
          <ToggleRow
            label="Sound"
            desc="Subtle synthesized instrument clicks"
            value={settings.sound}
            onChange={v => update({ sound: v })}
          />
        </div>
      </section>

      <section className="mb-7">
        <SectionLabel>MOTION</SectionLabel>
        <SegmentControl
          options={[
            { label: 'Full',    value: 'full'    },
            { label: 'Reduced', value: 'reduced' },
          ]}
          value={settings.motionMode}
          onChange={v => update({ motionMode: v as Settings['motionMode'] })}
        />
      </section>

      <section className="mb-7">
        <SectionLabel>BATTERY</SectionLabel>
        <SegmentControl
          options={[
            { label: 'Performance', value: 'performance' },
            { label: 'Balanced',    value: 'balanced'    },
            { label: 'Saver',       value: 'saver'       },
          ]}
          value={settings.batteryMode}
          onChange={v => {
            const mode = v as Settings['batteryMode']
            update({ batteryMode: mode })
            CompassEngine.setBatteryMode(mode)
          }}
        />
      </section>

      <section className="mb-7">
        <SectionLabel>DATA</SectionLabel>
        <div className="flex flex-col gap-2">
          <Link
            href="/location#waypoints"
            className="flex items-center justify-between px-4 py-3.5 rounded-xl"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            <div>
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Saved Waypoints
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Stored offline in IndexedDB
              </div>
            </div>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent)' }}>
              {waypoints.length} →
            </span>
          </Link>

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full px-4 py-3.5 rounded-xl text-left flex items-center justify-between min-h-[44px]"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm" style={{ color: '#EF4444' }}>
                {clearedMsg ? 'Local data cleared ✓' : 'Clear local data'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Reset
              </span>
            </button>
          ) : (
            <div
              className="p-4 rounded-xl flex flex-col gap-3"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.35)',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                Delete all {waypoints.length} saved waypoints and reset preferences to defaults?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearAllData}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[40px]"
                  style={{ background: '#EF4444', color: '#fff' }}
                >
                  CONFIRM CLEAR
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold tracking-widest min-h-[40px]"
                  style={{
                    background: 'var(--surface-raised)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-4">
        <SectionLabel>PRIVACY</SectionLabel>
        <div
          className="px-4 py-4 rounded-xl text-xs leading-relaxed"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          AXIS processes compass, motion and location information locally on your device whenever possible. The application does not require an account or send location information to a server.
        </div>
      </section>
    </motion.div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[10px] font-semibold tracking-[0.3em] mb-3"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h2>
  )
}

function SegmentControl({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex-1 py-3 text-xs font-semibold tracking-wide transition-colors min-h-[44px]"
          style={{
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? '#000' : 'var(--text-secondary)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string
  desc: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      <div>
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-all flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center"
        style={{ background: value ? 'var(--accent)' : 'var(--border)' }}
        aria-label={`Toggle ${label}`}
        role="switch"
        aria-checked={value}
      >
        <span
          className="absolute w-5 h-5 rounded-full transition-transform"
          style={{
            background: '#fff',
            left: '2px',
            transform: value ? 'translateX(24px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}
