'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/',         label: 'COMPASS',  icon: CompassIcon  },
  { href: '/tools',    label: 'TOOLS',    icon: ToolsIcon    },
  { href: '/location', label: 'LOCATION', icon: LocationIcon },
  { href: '/settings', label: 'SETTINGS', icon: SettingsIcon },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 h-16 flex items-stretch border-t"
      style={{
        background: 'var(--nav-bg)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)',
      }}
      aria-label="Main navigation"
    >
      <div className="max-w-md mx-auto w-full flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative min-h-[44px] transition-colors"
              style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute top-0 w-8 h-[2px]"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={19} strokeWidth={active ? 2 : 1.6} />
              <span
                className="text-[9px] font-semibold tracking-[0.18em]"
                style={{ opacity: active ? 1 : 0.85 }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function CompassIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" />
    </svg>
  )
}

function ToolsIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  )
}

function LocationIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function SettingsIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="var(--bg)" />
      <circle cx="15" cy="12" r="2" fill="var(--bg)" />
      <circle cx="10" cy="18" r="2" fill="var(--bg)" />
    </svg>
  )
}
