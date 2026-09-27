'use client'

interface InstrumentFrameProps {
  children: React.ReactNode
  className?: string
}

export default function InstrumentFrame({ children, className = '' }: InstrumentFrameProps) {
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        w-full max-w-sm
        mx-auto
        ${className}
      `}
      style={{ paddingBottom: 'var(--spacing-nav, 4rem)' }}
    >
      {children}
    </div>
  )
}
