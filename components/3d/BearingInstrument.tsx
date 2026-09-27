'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'
import { angleDifference } from '@/lib/geo/GeoEngine'

interface BearingInstrumentProps {
  currentHeading: number
  targetBearing: number
  tiltX: number
  tiltY: number
  motionMode: 'full' | 'reduced'
}

export default function BearingInstrument(props: BearingInstrumentProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 5.1], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
      frameloop={isVisible ? 'always' : 'never'}
    >
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        <ambientLight intensity={0.22} />
        <directionalLight position={[-3, 4, 4]} intensity={1.35} color="#FFF8F0" />
        <pointLight position={[3, -3, 2]} intensity={0.5} color="#B0C8FF" />
        <BearingDial {...props} />
      </Suspense>
    </Canvas>
  )
}

function BearingDial({
  currentHeading,
  targetBearing,
  tiltX,
  tiltY,
  motionMode,
}: BearingInstrumentProps) {
  const tiltGroupRef = useRef<THREE.Group>(null)
  const pointerGroupRef = useRef<THREE.Group>(null)
  const ringGroupRef = useRef<THREE.Group>(null)

  const stateRef = useRef({
    relAngle: angleDifference(currentHeading, targetBearing),
    ringHeading: currentHeading,
  })

  // Outer reticle ticks every 10°
  const tickGeo = useMemo(() => {
    const positions: number[] = []
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180
      const len = deg % 90 === 0 ? 0.18 : deg % 30 === 0 ? 0.11 : 0.06
      const r = 1.76
      positions.push(
        Math.sin(rad) * r,
        Math.cos(rad) * r,
        0.02,
        Math.sin(rad) * (r - len),
        Math.cos(rad) * (r - len),
        0.02
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  // Target spearhead pointer geometry
  const arrowGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 1.48)
    shape.lineTo(0.14, 0.96)
    shape.lineTo(0.035, 1.02)
    shape.lineTo(0.035, -0.45)
    shape.lineTo(-0.035, -0.45)
    shape.lineTo(-0.035, 1.02)
    shape.lineTo(-0.14, 0.96)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  useEffect(() => {
    return () => {
      tickGeo.dispose()
      arrowGeo.dispose()
    }
  }, [tickGeo, arrowGeo])

  const targetDiff = angleDifference(currentHeading, targetBearing)
  const isAligned = Math.abs(targetDiff) < 2

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = stateRef.current

    const desiredRel = angleDifference(currentHeading, targetBearing)
    const diffRel = angleDifference(s.relAngle, desiredRel)
    s.relAngle += diffRel * Math.min(1, dt * 12)

    const diffRing = angleDifference(s.ringHeading, currentHeading)
    s.ringHeading = ((s.ringHeading + diffRing * Math.min(1, dt * 12)) % 360 + 360) % 360

    if (pointerGroupRef.current) {
      // Negative Z rotation turns clockwise (+relAngle = turn right = clockwise)
      pointerGroupRef.current.rotation.z = -(s.relAngle * Math.PI) / 180
    }
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z = (s.ringHeading * Math.PI) / 180
    }
    if (tiltGroupRef.current) {
      if (motionMode === 'full') {
        const tx = THREE.MathUtils.clamp(-(tiltX / 60) * 0.18, -0.22, 0.22)
        const ty = THREE.MathUtils.clamp((tiltY / 60) * 0.18, -0.22, 0.22)
        tiltGroupRef.current.rotation.x = THREE.MathUtils.lerp(tiltGroupRef.current.rotation.x, tx, 0.1)
        tiltGroupRef.current.rotation.y = THREE.MathUtils.lerp(tiltGroupRef.current.rotation.y, ty, 0.1)
      } else {
        tiltGroupRef.current.rotation.x = 0
        tiltGroupRef.current.rotation.y = 0
      }
    }
  })

  return (
    <group ref={tiltGroupRef}>
      {/* Machined outer bezel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <cylinderGeometry args={[2.05, 2.1, 0.22, 96]} />
        <meshStandardMaterial color={COLORS.THREE.casingDark} roughness={0.32} metalness={0.88} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[1.92, 0.09, 20, 96]} />
        <meshStandardMaterial color={COLORS.THREE.bezzel} roughness={0.26} metalness={0.92} />
      </mesh>

      {/* Recessed matte face */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.86, 96]} />
        <meshStandardMaterial color={0x0c0c0b} roughness={0.8} metalness={0.15} />
      </mesh>

      {/* Inner reticle rings */}
      <mesh position={[0, 0, 0.008]}>
        <ringGeometry args={[1.05, 1.065, 96]} />
        <meshBasicMaterial color={isAligned ? COLORS.THREE.accent : 0x2a2a26} />
      </mesh>

      {/* Fixed 12 o'clock heading index mark */}
      <mesh position={[0, 1.78, 0.06]}>
        <boxGeometry args={[0.04, 0.16, 0.02]} />
        <meshBasicMaterial color={0xf5f5f0} />
      </mesh>

      {/* Rotating azimuth tick ring */}
      <group ref={ringGroupRef}>
        <lineSegments geometry={tickGeo}>
          <lineBasicMaterial color={0x6a6a64} />
        </lineSegments>
      </group>

      {/* Target bearing pointer arrow */}
      <group ref={pointerGroupRef} position={[0, 0, 0.045]}>
        <mesh geometry={arrowGeo}>
          <meshStandardMaterial
            color={COLORS.THREE.accent}
            emissive={COLORS.THREE.accent}
            emissiveIntensity={isAligned ? 0.85 : 0.35}
            roughness={0.25}
            metalness={0.5}
          />
        </mesh>
      </group>

      {/* Center hub */}
      <mesh position={[0, 0, 0.08]}>
        <circleGeometry args={[0.14, 32]} />
        <meshStandardMaterial color={COLORS.THREE.hub} roughness={0.2} metalness={0.92} />
      </mesh>
    </group>
  )
}
