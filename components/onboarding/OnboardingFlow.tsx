'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_KEY = 'axis:onboarding-done'

function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

function markOnboardingDone(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }
}

export default function OnboardingFlow({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<number | null>(null)

  useEffect(() => {
    if (hasCompletedOnboarding()) {
      setStep(null)
    } else {
      setStep(0)
    }
  }, [])

  function next() {
    setStep(s => {
      if (s === null) return null
      if (s >= 2) {
        markOnboardingDone()
        return null
      }
      return s + 1
    })
  }

  if (step === null) return <>{children}</>

  return (
    <>
      {children}
      <AnimatePresence>
        {step !== null && (
          <motion.div
            key="onboarding"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8"
            style={{ background: 'var(--bg)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  className="flex flex-col items-center gap-6 text-center"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Logo */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
                    >
                      <span style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>⊕</span>
                    </div>
                    <h1
                      className="text-4xl font-bold tracking-[0.3em]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      AXIS
                    </h1>
                  </div>
                  <button
                    onClick={next}
                    className="mt-8 px-10 py-3 rounded-full text-sm font-semibold tracking-widest transition-all"
                    style={{
                      background: 'var(--accent)',
                      color: '#000',
                    }}
                  >
                    GET STARTED
                  </button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  className="flex flex-col items-center gap-8 text-center max-w-xs"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                >
                  <p
                    className="text-2xl font-light leading-snug"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Precision navigation,<br />
                    <span style={{ color: 'var(--accent)' }}>built for your phone.</span>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Offline-first. No accounts. No tracking.
                  </p>
                  <button
                    onClick={next}
                    className="mt-4 px-10 py-3 rounded-full text-sm font-semibold tracking-widest transition-all"
                    style={{ background: 'var(--accent)', color: '#000' }}
                  >
                    CONTINUE
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  className="flex flex-col items-center gap-6 w-full max-w-xs"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2
                    className="text-xs font-semibold tracking-[0.3em]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    DEVICE CHECK
                  </h2>
                  <div className="w-full flex flex-col gap-3">
                    {[
                      { label: 'Motion sensor',  status: typeof window !== 'undefined' && 'DeviceMotionEvent' in window },
                      { label: 'Orientation',    status: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window },
                      { label: 'Compass',        status: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window },
                      { label: 'Location',       status: null },
                    ].map(({ label, status }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
                        <span className="text-sm font-semibold">
                          {status === null ? (
                            <span style={{ color: 'var(--text-muted)' }}>Optional</span>
                          ) : status ? (
                            <span style={{ color: 'var(--color-status-good, #22C55E)' }}>✓</span>
                          ) : (
                            <span style={{ color: 'var(--color-status-poor, #EF4444)' }}>✗</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={next}
                    className="mt-2 px-10 py-3 rounded-full text-sm font-semibold tracking-widest w-full transition-all"
                    style={{ background: 'var(--accent)', color: '#000' }}
                  >
                    CONTINUE
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
