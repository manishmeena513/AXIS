'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'

interface SunSceneProps {
  azimuth: number
  altitude: number
  isDaylight: boolean
}

export default function SunScene(props: SunSceneProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 1.35, 4.4], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
      frameloop={isVisible ? 'always' : 'never'}
    >
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        <ambientLight intensity={0.22} />
        <SolarDomeAssembly {...props} />
      </Suspense>
    </Canvas>
  )
}

function SolarDomeAssembly({ azimuth, altitude }: SunSceneProps) {
  const domeRef = useRef<THREE.Group>(null)

  // Solar arc path across the sky dome (built as line segments)
  const arcGeo = useMemo(() => {
    const pts: number[] = []
    const r = 1.65
    for (let i = -90; i < 90; i += 5) {
      const rad1 = (i * Math.PI) / 180
      const rad2 = ((i + 5) * Math.PI) / 180
      pts.push(
        Math.sin(rad1) * r,
        Math.cos(rad1) * r * 0.68,
        -Math.cos(rad1) * r * 0.45,
        Math.sin(rad2) * r,
        Math.cos(rad2) * r * 0.68,
        -Math.cos(rad2) * r * 0.45
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return geo
  }, [])

  useEffect(() => {
    return () => {
      arcGeo.dispose()
    }
  }, [arcGeo])

  // Position of the 3D sun along the celestial hemisphere based on altitude & azimuth
  const sunPos = useMemo((): [number, number, number] => {
    const r = 1.65
    // Map azimuth (90° East -> 180° South -> 270° West) and altitude (-90° to +90°)
    const altRad = (THREE.MathUtils.clamp(altitude, -35, 85) * Math.PI) / 180
    const azRad = ((azimuth - 180) * Math.PI) / 180
    const x = Math.sin(azRad) * Math.cos(altRad) * r
    const y = Math.sin(altRad) * r * 0.85
    const z = -Math.cos(azRad) * Math.cos(altRad) * r * 0.45
    return [x, y, z]
  }, [azimuth, altitude])

  useFrame((_, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y = Math.sin(Date.now() * 0.0004) * 0.08
    }
    void delta
  })

  const isAboveHorizon = altitude >= -0.833

  return (
    <group ref={domeRef} position={[0, -0.25, 0]}>
      {/* Horizon base ring & matte ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.75, 96]} />
        <meshStandardMaterial color={0x0e0e0c} roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.72, 1.76, 96]} />
        <meshBasicMaterial color={COLORS.THREE.bezzel} />
      </mesh>

      {/* East-West and North-South horizon axes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <planeGeometry args={[3.4, 0.01]} />
        <meshBasicMaterial color={0x2a2a26} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.006, 0]}>
        <planeGeometry args={[3.4, 0.01]} />
        <meshBasicMaterial color={0x2a2a26} />
      </mesh>

      {/* Solar trajectory arc */}
      <lineSegments geometry={arcGeo}>
        <lineBasicMaterial color={0x4a4a44} />
      </lineSegments>

      {/* 3D Sun Orb + Atmospheric Corona Glow */}
      <group position={sunPos}>
        <pointLight
          intensity={isAboveHorizon ? 2.4 : 0.4}
          color={altitude < 8 ? '#FF8C1A' : '#FFF2CC'}
          distance={6}
        />
        {/* Core photosphere */}
        <mesh>
          <sphereGeometry args={[0.21, 48, 48]} />
          <meshStandardMaterial
            color={isAboveHorizon ? 0xffd27d : 0x6a5030}
            emissive={isAboveHorizon ? 0xf59e0b : 0x4a3010}
            emissiveIntensity={isAboveHorizon ? 1.5 : 0.35}
            roughness={0.2}
          />
        </mesh>
        {/* Outer atmospheric halo */}
        <mesh>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshBasicMaterial
            color={0xf59e0b}
            transparent
            opacity={isAboveHorizon ? 0.2 : 0.06}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
