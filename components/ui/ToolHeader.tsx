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
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 rounded-full transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Back"
        >
          <svg
            width="18"
            height="18"
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
            className="text-xs font-semibold tracking-[0.3em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </header>
  )
}
