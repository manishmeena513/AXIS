'use client'

import HeadingLock from './HeadingLock'
import { shortestAngularDiff } from '@/lib/compass/CompassEngine'

function headingToCardinal(h: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round((((h % 360) + 360) % 360) / 22.5) % 16]
}

interface HeadingDisplayProps {
  heading:       number
  precision:     0 | 1
  northMode:     'magnetic' | 'true'
  lockedHeading: number | null
}

export default function HeadingDisplay({
  heading,
  precision,
  northMode,
  lockedHeading,
}: HeadingDisplayProps) {
  const formattedHeading =
    precision === 1 ? heading.toFixed(1) : Math.round(heading).toString()

  const cardinal = headingToCardinal(heading)

  const isAligned =
    lockedHeading !== null &&
    Math.abs(shortestAngularDiff(heading, lockedHeading)) < 2

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Main heading */}
      <div
        className="text-6xl font-light tracking-tight leading-none"
        style={{
          color: isAligned ? 'var(--accent)' : 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-live="polite"
      >
        {formattedHeading}°
      </div>

      {/* Cardinal + north mode badge */}
      <div className="flex items-center gap-2 mt-0.5">
        <span
          className="text-xl font-medium tracking-[0.25em]"
          style={{ color: isAligned ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          {isAligned ? 'ALIGNED' : cardinal}
        </span>
        <span
          className="text-[9px] font-semibold tracking-widest px-1.5 py-0.5 rounded"
          style={{
            background: 'var(--surface-raised)',
            color: northMode === 'true' ? 'var(--accent)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          {northMode === 'true' ? 'TRUE' : 'MAG'}
        </span>
      </div>

      {/* Lock readout */}
      <HeadingLock
        heading={heading}
        lockedHeading={lockedHeading}
        precision={precision}
      />
    </div>
  )
}
