'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'
import { angleDifference } from '@/lib/geo/GeoEngine'
import { useTheme } from '@/hooks/useTheme'

interface QiblaInstrumentProps {
  currentHeading: number
  qiblaBearing: number
  tiltX: number
  tiltY: number
  motionMode: 'full' | 'reduced'
}

export default function QiblaInstrument(props: QiblaInstrumentProps) {
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
        <ambientLight intensity={isLight ? 0.62 : 0.24} color={isLight ? '#FAF7F0' : '#FFFFFF'} />
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
        <QiblaDial {...props} isLight={isLight} />
      </Suspense>
    </Canvas>
  )
}

function QiblaDial({
  currentHeading,
  qiblaBearing,
  tiltX,
  tiltY,
  motionMode,
  isLight,
}: QiblaInstrumentProps & { isLight: boolean }) {
  const tiltGroupRef = useRef<THREE.Group>(null)
  const spireGroupRef = useRef<THREE.Group>(null)
  const ringGroupRef = useRef<THREE.Group>(null)

  const stateRef = useRef({
    relAngle: angleDifference(currentHeading, qiblaBearing),
    ringHeading: currentHeading,
  })

  // Sculpted 3D Qibla directional spire needle
  const spireGeo = useMemo(() => {
    const pos = new Float32Array([
      // Left facet
      0,     1.52, 0.025,
      -0.17, 0.14, 0.025,
      0,     0.32, 0.095,
      // Right facet
      0,     1.52, 0.025,
      0,     0.32, 0.095,
      0.17,  0.14, 0.025,
      // Lower left counterweight tail
      -0.17, 0.14, 0.025,
      0,    -0.58, 0.025,
      0,     0.32, 0.095,
      // Lower right counterweight tail
      0,     0.32, 0.095,
      0,    -0.58, 0.025,
      0.17,  0.14, 0.025,
    ])
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  // Refined 5°/15°/45° degree ticks on the outer chapter ring
  const degreeTicksGeo = useMemo(() => {
    const positions: number[] = []
    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180
      const len = deg % 45 === 0 ? 0.16 : deg % 15 === 0 ? 0.11 : 0.055
      const r = 1.76
      positions.push(
        Math.sin(rad) * r,
        Math.cos(rad) * r,
        0.016,
        Math.sin(rad) * (r - len),
        Math.cos(rad) * (r - len),
        0.016
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  // 8-point geometric star inlay in the center medallion
  const octagramGeo = useMemo(() => {
    const positions: number[] = []
    const r = 1.18
    const pts = 8
    for (let i = 0; i < pts; i++) {
      const a1 = (i * Math.PI * 2) / pts
      const a2 = (((i + 3) % pts) * Math.PI * 2) / pts
      positions.push(
        Math.sin(a1) * r,
        Math.cos(a1) * r,
        0.012,
        Math.sin(a2) * r,
        Math.cos(a2) * r,
        0.012
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useEffect(() => {
    return () => {
      spireGeo.dispose()
      degreeTicksGeo.dispose()
      octagramGeo.dispose()
    }
  }, [spireGeo, degreeTicksGeo, octagramGeo])

  const diff = angleDifference(currentHeading, qiblaBearing)
  const isAligned = Math.abs(diff) < 2

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = stateRef.current
    const desired = angleDifference(currentHeading, qiblaBearing)
    const d = angleDifference(s.relAngle, desired)
    s.relAngle += d * Math.min(1, dt * 12)

    const dRing = angleDifference(s.ringHeading, currentHeading)
    s.ringHeading = ((s.ringHeading + dRing * Math.min(1, dt * 12)) % 360 + 360) % 360

    if (spireGroupRef.current) {
      spireGroupRef.current.rotation.z = -(s.relAngle * Math.PI) / 180
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

  // Two-tone chapter ring + graphite medallion in Light Mode
  const chapterRingColor = isLight ? 0xe4e1d7 : 0x161614
  const medallionColor   = isLight ? 0x22211f : 0x0d0d0c
  const tickColor        = isLight ? 0x3a3936 : 0x7a7a72

  return (
    <group ref={tiltGroupRef}>
      {/* 1. Brushed graphite outer body */}
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

      {/* 2. Stepped outer chapter ring (Stone/Ivory in Light Mode) */}
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.34, 1.86, 128]} />
        <meshStandardMaterial
          color={chapterRingColor}
          roughness={0.55}
          metalness={0.18}
        />
      </mesh>

      {/* Rotating compass chapter ticks */}
      <group ref={ringGroupRef}>
        <lineSegments geometry={degreeTicksGeo}>
          <lineBasicMaterial color={tickColor} />
        </lineSegments>
      </group>

      {/* Metallic separator ring */}
      <mesh position={[0, 0, 0.012]}>
        <ringGeometry args={[1.32, 1.35, 128]} />
        <meshStandardMaterial
          color={isAligned ? COLORS.THREE.accent : isLight ? 0x8a8578 : 0x4a4a44}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* 3. Inner graphite medallion dial */}
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[1.33, 96]} />
        <meshStandardMaterial
          color={medallionColor}
          roughness={0.76}
          metalness={0.2}
        />
      </mesh>

      {/* Geometric 8-point star inlay */}
      <lineSegments geometry={octagramGeo}>
        <lineBasicMaterial color={isAligned ? COLORS.THREE.accent : isLight ? 0x4a463d : 0x2c2c28} />
      </lineSegments>

      {/* Top 12 o'clock Makkah alignment index */}
      <mesh position={[0, 1.76, 0.055]}>
        <boxGeometry args={[0.11, 0.11, 0.06]} />
        <meshStandardMaterial
          color={isAligned ? COLORS.THREE.accent : isLight ? 0x2c2b29 : 0xd4d0c8}
          emissive={COLORS.THREE.accent}
          emissiveIntensity={isAligned ? 0.9 : 0.15}
          roughness={0.25}
          metalness={0.75}
        />
      </mesh>

      {/* 4. Rotating Qibla Spire Needle */}
      <group ref={spireGroupRef} position={[0, 0, 0.032]}>
        <mesh geometry={spireGeo}>
          <meshStandardMaterial
            color={COLORS.THREE.accent}
            emissive={COLORS.THREE.accent}
            emissiveIntensity={isAligned ? 0.65 : 0.22}
            roughness={0.22}
            metalness={0.78}
          />
        </mesh>
      </group>

      {/* 5. Elegant stepped center hub */}
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

      {/* 6. Translucent glass cover */}
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
