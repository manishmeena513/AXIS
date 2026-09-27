'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/',          label: 'Compass',  icon: CompassIcon  },
  { href: '/tools',     label: 'Tools',    icon: ToolsIcon    },
  { href: '/location',  label: 'Location', icon: LocationIcon },
  { href: '/settings',  label: 'Settings', icon: SettingsIcon },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-end pb-2 border-t"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        // Active if exact match for / or starts-with for sub-routes
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex flex-1 flex-col items-center justify-end pb-1 gap-0.5 min-h-[44px] min-w-[44px] transition-colors"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                style={{ background: 'var(--accent)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <Icon size={22} />
            <span className="text-[10px] font-medium tracking-wide leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/* ─── Icons ─────────────────────────────────────────────────────────── */

function CompassIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,2 14.5,9 12,11.5 9.5,9" fill="currentColor" stroke="none" />
      <polygon points="12,22 9.5,15 12,12.5 14.5,15" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  )
}

function ToolsIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function LocationIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function SettingsIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
