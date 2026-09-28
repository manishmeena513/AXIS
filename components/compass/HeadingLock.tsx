'use client'

import { shortestAngularDiff } from '@/lib/compass/CompassEngine'

interface HeadingLockProps {
  heading: number
  lockedHeading: number | null
  precision: 0 | 1
}

export default function HeadingLock({ heading, lockedHeading, precision }: HeadingLockProps) {
  if (lockedHeading === null) return null

  const diff = shortestAngularDiff(heading, lockedHeading)
  const isAligned = Math.abs(diff) < 2

  return (
    <div
      className="instrument-panel grid grid-cols-3 divide-x px-4 py-2.5 mt-2.5 min-w-[250px]"
      style={{
        borderColor: isAligned ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="text-center pr-3" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          TARGET
        </div>
        <div className="text-xs font-mono font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
          {lockedHeading.toFixed(precision)}°
        </div>
      </div>

      <div className="text-center px-3" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          CURRENT
        </div>
        <div className="text-xs font-mono font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
          {heading.toFixed(precision)}°
        </div>
      </div>

      <div className="text-center pl-3" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          {isAligned ? 'STATUS' : 'TURN'}
        </div>
        <div
          className="text-xs font-mono font-semibold mt-0.5"
          style={{ color: isAligned ? 'var(--accent)' : 'var(--text-primary)' }}
        >
          {isAligned ? 'ALIGNED' : `${diff > 0 ? '→' : '←'} ${Math.abs(diff).toFixed(1)}°`}
        </div>
      </div>
    </div>
  )
}
