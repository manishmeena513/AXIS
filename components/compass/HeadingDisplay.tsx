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
    <div className="flex flex-col items-center select-none">
      {/* Main heading */}
      <div
        className="text-[58px] font-light tracking-[-0.03em] leading-none font-mono"
        style={{
          color: isAligned ? 'var(--accent)' : 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-live="polite"
      >
        {formattedHeading}°
      </div>

      {/* Cardinal direction & subtle North reference badge */}
      <div className="flex items-center gap-2 mt-1.5">
        <span
          className="text-base font-semibold tracking-[0.2em]"
          style={{ color: isAligned ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          {isAligned ? 'ALIGNED' : cardinal}
        </span>
        <span
          className="text-[9px] font-mono font-semibold tracking-[0.16em] px-1.5 py-0.5 rounded-[4px]"
          style={{
            background: 'var(--surface)',
            color: northMode === 'true' ? 'var(--accent)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          {northMode === 'true' ? 'TRUE' : 'MAG'}
        </span>
      </div>

      {/* Precision Lock Readout */}
      <HeadingLock
        heading={heading}
        lockedHeading={lockedHeading}
        precision={precision}
      />
    </div>
  )
}
