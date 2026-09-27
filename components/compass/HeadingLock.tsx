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
      className="flex items-center justify-center gap-5 px-4 py-2 rounded-xl mt-1"
      style={{
        background: 'var(--surface-raised)',
        border: `1px solid ${isAligned ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <div className="text-center">
        <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
          TARGET
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {lockedHeading.toFixed(precision)}°
        </div>
      </div>

      <div className="h-5 w-px" style={{ background: 'var(--border)' }} />

      <div className="text-center">
        <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
          CURRENT
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {heading.toFixed(precision)}°
        </div>
      </div>

      <div className="h-5 w-px" style={{ background: 'var(--border)' }} />

      <div className="text-center min-w-[68px]">
        <div className="text-[9px] tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
          {isAligned ? 'STATUS' : 'TURN'}
        </div>
        <div
          className="text-xs font-semibold tracking-wider"
          style={{ color: isAligned ? 'var(--accent)' : 'var(--text-primary)' }}
        >
          {isAligned ? 'ALIGNED' : `${diff > 0 ? '→' : '←'} ${Math.abs(diff).toFixed(1)}°`}
        </div>
      </div>
    </div>
  )
}
