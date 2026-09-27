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
      className="flex flex-col h-full px-5 pt-4 pb-6 max-w-md mx-auto w-full justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <ToolHeader
        title="LEVEL"
        subtitle="3D Precision Spirit Level & Inclinometer"
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
            className="text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full min-h-[40px]"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            ZERO
          </button>
        }
      />

      {/* 3D Spirit Level */}
      <div
        className="relative w-full max-w-[290px] aspect-square mx-auto my-auto"
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

      {/* Pitch & Roll Readout (Part H) */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="text-sm font-semibold tracking-[0.35em] px-4 py-1 rounded-full"
          style={{
            color: isLevel ? '#000' : 'var(--text-muted)',
            background: isLevel ? 'var(--accent)' : 'transparent',
          }}
        >
          {isLevel ? 'LEVEL' : `TILT ${totalTilt.toFixed(1)}°`}
        </div>

        <div
          className="w-full grid grid-cols-2 gap-4 py-4 px-5 rounded-2xl text-center"
          style={{
            background: 'var(--surface-raised)',
            border: `1px solid ${isLevel ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div>
            <div className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              PITCH
            </div>
            <div
              className="text-3xl font-light font-mono mt-1"
              style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSignedDeg(pitch)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
              ROLL
            </div>
            <div
              className="text-3xl font-light font-mono mt-1"
              style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSignedDeg(roll)}
            </div>
          </div>
        </div>

        {/* Tolerance Selector */}
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
            TOLERANCE
          </span>
          <div className="flex gap-1.5">
            {[0.5, 1.0, 2.0].map(tol => (
              <button
                key={tol}
                onClick={() => setTolerance(tol)}
                className="px-3 py-1 rounded-full text-[11px] font-mono min-h-[36px]"
                style={{
                  background: tolerance === tol ? 'var(--accent)' : 'var(--surface-raised)',
                  color: tolerance === tol ? '#000' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
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
