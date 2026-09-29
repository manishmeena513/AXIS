'use client'

import HeadingLock from './HeadingLock'
import { shortestAngularDiff } from '@/lib/compass/CompassEngine'
import type { CompassStatus } from '@/lib/sensors/types'

function headingToCardinal(h: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round((((h % 360) + 360) % 360) / 22.5) % 16]
}

const INACTIVE_STATUS_LABELS: Record<Exclude<CompassStatus, 'ACTIVE'>, string> = {
  IDLE:                  'INITIALIZING SENSOR',
  PERMISSION_REQUIRED:   'PERMISSION REQUIRED',
  REQUESTING_PERMISSION: 'STARTING SENSOR…',
  UNAVAILABLE:           'SENSOR UNAVAILABLE',
  ERROR:                 'SENSOR ERROR',
}

interface HeadingDisplayProps {
  heading:         number
  precision:       0 | 1
  northMode:       'magnetic' | 'true'
  lockedHeading:   number | null
  compassStatus:   CompassStatus
  hasValidHeading: boolean
}

export default function HeadingDisplay({
  heading,
  precision,
  northMode,
  lockedHeading,
  compassStatus,
  hasValidHeading,
}: HeadingDisplayProps) {
  const isActive = compassStatus === 'ACTIVE' && hasValidHeading

  if (!isActive) {
    const statusLabel =
      compassStatus === 'ACTIVE'
        ? 'WAITING FOR SENSOR'
        : INACTIVE_STATUS_LABELS[compassStatus]

    return (
      <div className="flex flex-col items-center select-none">
        <div
          className="text-[52px] font-light tracking-[-0.03em] leading-none font-mono"
          style={{
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
          aria-live="polite"
        >
          ---°
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-xs font-mono font-semibold tracking-[0.22em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    )
  }

  const formattedHeading =
    precision === 1 ? heading.toFixed(1) : Math.round(heading).toString()

  const cardinal = headingToCardinal(heading)

  const isAligned =
    lockedHeading !== null &&
    Math.abs(shortestAngularDiff(heading, lockedHeading)) < 2

  return (
    <div className="flex flex-col items-center select-none">
      {/* Main verified live heading */}
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
