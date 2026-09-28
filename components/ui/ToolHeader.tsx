'use client'

import Link from 'next/link'

interface ToolHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  rightSlot?: React.ReactNode
}

export default function ToolHeader({
  title,
  subtitle,
  backHref = '/tools',
  rightSlot,
}: ToolHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between py-2 mb-3 select-none">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="instrument-btn flex items-center justify-center w-9 h-9 rounded-full"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Back"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1
            className="text-xs font-bold tracking-[0.28em]"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] tracking-[0.14em] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </header>
  )
}
