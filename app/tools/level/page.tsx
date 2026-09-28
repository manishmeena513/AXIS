'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import ToolHeader from '@/components/ui/ToolHeader'
import { useCompass } from '@/hooks/useCompass'
import { haptic } from '@/lib/haptics/hapticEngine'

const LevelScene = dynamic(() => import('@/components/3d/LevelScene'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    />
  ),
})

export default function LevelPage() {
  const compass = useCompass()
  const [tolerance, setTolerance] = useState<number>(1.0)
  const [simPitch, setSimPitch] = useState(0.4)
  const [simRoll, setSimRoll] = useState(-0.2)
  const [usingSim, setUsingSim] = useState(false)

  const pitch = usingSim || !compass.sensorAvailable ? simPitch : compass.tiltX
  const roll  = usingSim || !compass.sensorAvailable ? simRoll  : compass.tiltY

  const totalTilt = Math.hypot(pitch, roll)
  const isLevel = totalTilt <= tolerance

  const wasLevelRef = useRef(false)
  useEffect(() => {
    if (isLevel && !wasLevelRef.current) {
      haptic.levelAchieved()
      wasLevelRef.current = true
    } else if (!isLevel) {
      wasLevelRef.current = false
    }
  }, [isLevel])

  const dragRef = useRef<{ x: number; y: number; startP: number; startR: number } | null>(null)

  function formatSignedDeg(val: number): string {
    const rounded = Math.abs(val) < 0.05 ? 0 : val
    const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '+'
    return `${sign}${Math.abs(rounded).toFixed(1)}°`
  }

  return (
    <motion.div
      className="flex flex-col h-full px-5 pt-3 pb-5 max-w-md mx-auto w-full justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader
        title="LEVEL"
        subtitle="Precision Spirit Inclinometer"
        rightSlot={
          <button
            onClick={() => {
              if (usingSim || !compass.sensorAvailable) {
                setSimPitch(0)
                setSimRoll(0)
              } else {
                compass.resetTilt()
              }
            }}
            className="instrument-btn text-[10px] font-mono font-semibold tracking-[0.16em] px-3 py-1.5 min-h-[36px]"
          >
            ZERO
          </button>
        }
      />

      {/* 3D Spirit Level grounded in physical dial shell */}
      <div
        className="instrument-dial-shell relative w-full max-w-[284px] aspect-square mx-auto my-auto"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={e => {
          dragRef.current = { x: e.clientX, y: e.clientY, startP: pitch, startR: roll }
        }}
        onPointerMove={e => {
          if (!dragRef.current) return
          const dx = e.clientX - dragRef.current.x
          const dy = e.clientY - dragRef.current.y
          if (Math.hypot(dx, dy) > 3) {
            setUsingSim(true)
            setSimRoll(Math.max(-25, Math.min(25, dragRef.current.startR - dx * 0.12)))
            setSimPitch(Math.max(-25, Math.min(25, dragRef.current.startP - dy * 0.12)))
          }
        }}
        onPointerUp={() => {
          dragRef.current = null
        }}
      >
        <LevelScene pitch={pitch} roll={roll} isLevel={isLevel} />
      </div>

      {/* Compact Technical Readout & Tolerance Selector (Section 10) */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-mono font-semibold tracking-[0.22em] px-3 py-1 rounded-[5px]"
            style={{
              color: isLevel ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              background: isLevel ? 'var(--accent)' : 'var(--surface)',
              border: `1px solid ${isLevel ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {isLevel ? 'LEVEL' : `TILT ${totalTilt.toFixed(1)}°`}
          </span>
        </div>

        <div
          className="instrument-panel w-full grid grid-cols-2 divide-x py-3.5 px-4 text-center"
          style={{
            borderColor: isLevel ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div className="pr-3" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[9px] font-semibold tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
              PITCH
            </div>
            <div
              className="text-3xl font-light font-mono tracking-tight mt-0.5"
              style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSignedDeg(pitch)}
            </div>
          </div>

          <div className="pl-3" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[9px] font-semibold tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
              ROLL
            </div>
            <div
              className="text-3xl font-light font-mono tracking-tight mt-0.5"
              style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSignedDeg(roll)}
            </div>
          </div>
        </div>

        {/* Precision Tolerance Selector */}
        <div className="flex items-center justify-between w-full pt-0.5">
          <span className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            TOLERANCE
          </span>
          <div className="instrument-well flex p-0.5 gap-1">
            {[0.5, 1.0, 2.0].map(tol => (
              <button
                key={tol}
                onClick={() => setTolerance(tol)}
                className={`${
                  tolerance === tol ? 'instrument-btn-active' : 'text-[var(--text-secondary)]'
                } px-3 py-1 text-[11px] font-mono font-semibold min-h-[32px] transition-all`}
              >
                ±{tol.toFixed(1)}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
