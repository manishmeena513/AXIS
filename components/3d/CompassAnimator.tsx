'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TIMING } from '@/lib/design/tokens'
import { shortestAngularDiff } from '@/lib/compass/CompassEngine'

interface CompassAnimatorProps {
  heading:      number
  tiltX:        number
  tiltY:        number
  motionMode:   'full' | 'reduced'
  batteryMode:  'performance' | 'balanced' | 'saver'
  bodyElement:  React.ReactNode
  ringElement:  React.ReactNode
}

export default function CompassAnimator({
  heading,
  tiltX,
  tiltY,
  motionMode,
  batteryMode,
  bodyElement,
  ringElement,
}: CompassAnimatorProps) {
  const tiltGroupRef = useRef<THREE.Group>(null)
  const ringGroupRef = useRef<THREE.Group>(null)
  const stateRef = useRef({
    currentHeading: heading,
    angularVel: 0,
    ambientPhase: 0,
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = stateRef.current

    // 1. Physical spring-damper rotation for DegreeRing + Needle
    if (ringGroupRef.current) {
      const diff = shortestAngularDiff(s.currentHeading, heading)

      if (motionMode === 'reduced') {
        s.currentHeading = ((s.currentHeading + diff * 0.35) % 360 + 360) % 360
        s.angularVel = 0
      } else {
        // Spring stiffness and damping tuned by battery mode
        const stiffness = batteryMode === 'performance' ? 110 : batteryMode === 'balanced' ? 85 : 60
        const damping   = batteryMode === 'performance' ? 16  : batteryMode === 'balanced' ? 14 : 12

        const accel = diff * stiffness - s.angularVel * damping
        s.angularVel += accel * dt
        s.currentHeading = ((s.currentHeading + s.angularVel * dt) % 360 + 360) % 360
      }

      // Rotate around +Z so that heading `h` on the ring aligns with 12 o'clock (+Y)
      ringGroupRef.current.rotation.z = (s.currentHeading * Math.PI) / 180
    }

    // 2. Subtle 3D tilt parallax & ambient breathing on the whole instrument assembly
    if (tiltGroupRef.current) {
      if (motionMode === 'full') {
        s.ambientPhase += dt * 0.8
        const ambientX = Math.sin(s.ambientPhase) * 0.012
        const ambientY = Math.cos(s.ambientPhase * 0.7) * 0.012

        const targetRotX = THREE.MathUtils.clamp(-(tiltX / 60) * 0.22, -0.26, 0.26) + ambientX
        const targetRotY = THREE.MathUtils.clamp((tiltY / 60) * 0.22, -0.26, 0.26) + ambientY

        tiltGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          tiltGroupRef.current.rotation.x,
          targetRotX,
          0.08
        )
        tiltGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          tiltGroupRef.current.rotation.y,
          targetRotY,
          0.08
        )
      } else {
        tiltGroupRef.current.rotation.x = 0
        tiltGroupRef.current.rotation.y = 0
      }
    }
  })

  return (
    <group ref={tiltGroupRef}>
      {bodyElement}
      <group ref={ringGroupRef}>
        {ringElement}
      </group>
    </group>
  )
}
