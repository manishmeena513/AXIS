'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'
import { angleDifference } from '@/lib/geo/GeoEngine'
import { useTheme } from '@/hooks/useTheme'

interface BearingInstrumentProps {
  currentHeading: number
  targetBearing: number
  tiltX: number
  tiltY: number
  motionMode: 'full' | 'reduced'
}

export default function BearingInstrument(props: BearingInstrumentProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

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
        <ambientLight intensity={isLight ? 0.6 : 0.24} color={isLight ? '#FAF7F0' : '#FFFFFF'} />
        <directionalLight
          position={[-3, 4, 4.2]}
          intensity={isLight ? 1.85 : 1.45}
          color="#FFFDF8"
        />
        <directionalLight
          position={[3, -3, 2.5]}
          intensity={isLight ? 0.75 : 0.5}
          color={isLight ? '#DCE6F5' : '#B0C8FF'}
        />
        <BearingDial {...props} isLight={isLight} />
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
  isLight,
}: BearingInstrumentProps & { isLight: boolean }) {
  const tiltGroupRef = useRef<THREE.Group>(null)
  const pointerGroupRef = useRef<THREE.Group>(null)
  const ringGroupRef = useRef<THREE.Group>(null)

  const stateRef = useRef({
    relAngle: angleDifference(currentHeading, targetBearing),
    ringHeading: currentHeading,
  })

  // Refined 5°/15°/45° azimuth ticks
  const tickGeo = useMemo(() => {
    const positions: number[] = []
    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180
      const len = deg % 45 === 0 ? 0.18 : deg % 15 === 0 ? 0.12 : 0.06
      const r = 1.78
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

  // 3D faceted target course pointer
  const pointerGeo = useMemo(() => {
    const pos = new Float32Array([
      // Upper left blade
      0,     1.54, 0.02,
      -0.15, 0.92, 0.02,
      0,     0.98, 0.075,
      // Upper right blade
      0,     1.54, 0.02,
      0,     0.98, 0.075,
      0.15,  0.92, 0.02,
      // Center shaft left
      -0.04, 0.96, 0.02,
      -0.04,-0.65, 0.02,
      0,     0.0,  0.065,
      // Center shaft right
      0,     0.0,  0.065,
      -0.04,-0.65, 0.02,
      0.04, -0.65, 0.02,
      0,     0.0,  0.065,
      0.04, -0.65, 0.02,
      0.04,  0.96, 0.02,
    ])
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  useEffect(() => {
    return () => {
      tickGeo.dispose()
      pointerGeo.dispose()
    }
  }, [tickGeo, pointerGeo])

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

  const outerTrackColor = isLight ? 0xe2dfd5 : 0x161615
  const centerWellColor = isLight ? 0x1e1d1b : 0x0c0c0b
  const tickColor       = isLight ? 0x343330 : 0x7a7a72

  return (
    <group ref={tiltGroupRef}>
      {/* 1. Brushed graphite outer casing */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <cylinderGeometry args={[2.05, 2.1, 0.24, 96]} />
        <meshStandardMaterial
          color={isLight ? COLORS.THREE_LIGHT.casingOuter : COLORS.THREE.casingDark}
          roughness={0.34}
          metalness={0.85}
        />
      </mesh>

      {/* Machined outer bezel */}
      <mesh position={[0, 0, 0.035]}>
        <torusGeometry args={[1.92, 0.095, 24, 128]} />
        <meshStandardMaterial
          color={isLight ? COLORS.THREE_LIGHT.bezelMetal : COLORS.THREE.bezzel}
          roughness={0.26}
          metalness={0.9}
        />
      </mesh>

      {/* 2. Stepped azimuth track ring */}
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.26, 1.86, 128]} />
        <meshStandardMaterial color={outerTrackColor} roughness={0.55} metalness={0.18} />
      </mesh>

      {/* Deep graphite inner navigation well */}
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[1.27, 96]} />
        <meshStandardMaterial color={centerWellColor} roughness={0.78} metalness={0.18} />
      </mesh>

      {/* Inner reticle range ring & crosshairs */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[1.25, 1.275, 96]} />
        <meshBasicMaterial color={isAligned ? COLORS.THREE.accent : isLight ? 0x8a857a : 0x3a3a36} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[0.72, 0.735, 64]} />
        <meshBasicMaterial color={0x32312e} />
      </mesh>

      {/* Fixed 12 o'clock heading index mark */}
      <mesh position={[0, 1.77, 0.06]}>
        <boxGeometry args={[0.05, 0.16, 0.025]} />
        <meshBasicMaterial color={isLight ? 0x171717 : 0xf5f5f0} />
      </mesh>

      {/* Rotating azimuth tick ring */}
      <group ref={ringGroupRef}>
        <lineSegments geometry={tickGeo}>
          <lineBasicMaterial color={tickColor} />
        </lineSegments>
      </group>

      {/* 3. Target bearing pointer */}
      <group ref={pointerGroupRef} position={[0, 0, 0.04]}>
        <mesh geometry={pointerGeo}>
          <meshStandardMaterial
            color={COLORS.THREE.accent}
            emissive={COLORS.THREE.accent}
            emissiveIntensity={isAligned ? 0.75 : 0.25}
            roughness={0.24}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* 4. Machined metallic center hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.095]}>
        <cylinderGeometry args={[0.15, 0.17, 0.05, 48]} />
        <meshStandardMaterial color={isLight ? 0x4a4945 : 0x2a2a26} roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.125]}>
        <sphereGeometry args={[0.09, 32, 32]} />
        <meshStandardMaterial
          color={isLight ? COLORS.THREE_LIGHT.hub : COLORS.THREE.hub}
          roughness={0.16}
          metalness={0.95}
        />
      </mesh>

      {/* 5. Glass cover */}
      <mesh position={[0, 0, 0.16]} renderOrder={10}>
        <circleGeometry args={[1.86, 96]} />
        <meshPhysicalMaterial
          color={0xffffff}
          roughness={0.04}
          metalness={0.0}
          transmission={0.92}
          transparent
          opacity={isLight ? 0.1 : 0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
