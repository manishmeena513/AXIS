'use client'

import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'

interface CompassBodyProps {
  isLight?: boolean
}

export default function CompassBody({ isLight = false }: CompassBodyProps) {
  // Subtle knurling ticks around outer bezel
  const bezelTicksGeo = useMemo(() => {
    const positions: number[] = []
    for (let deg = 0; deg < 360; deg += 3) {
      const rad = (deg * Math.PI) / 180
      const r1 = 2.04
      const r2 = 2.12
      positions.push(
        Math.sin(rad) * r1, Math.cos(rad) * r1, 0.04,
        Math.sin(rad) * r2, Math.cos(rad) * r2, 0.02
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  // Fixed Lubber Line triangle at 12 o'clock (top index mark)
  const lubberGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 1.76)
    shape.lineTo(0.06, 1.93)
    shape.lineTo(-0.06, 1.93)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  useEffect(() => {
    return () => {
      bezelTicksGeo.dispose()
      lubberGeo.dispose()
    }
  }, [bezelTicksGeo, lubberGeo])

  const casingColor  = isLight ? COLORS.THREE_LIGHT.casingOuter  : COLORS.THREE.casingDark
  const bezelColor   = isLight ? COLORS.THREE_LIGHT.bezelMetal   : COLORS.THREE.bezzel
  const chamferColor = isLight ? COLORS.THREE_LIGHT.bezelChamfer : 0x252522
  const dialColor    = isLight ? COLORS.THREE_LIGHT.dialDark     : 0x0c0c0b

  return (
    <group>
      {/* 1. Outer metallic casing */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.14]}>
        <cylinderGeometry args={[2.18, 2.22, 0.28, 128]} />
        <meshStandardMaterial
          color={casingColor}
          roughness={isLight ? 0.36 : 0.32}
          metalness={isLight ? 0.82 : 0.88}
        />
      </mesh>

      {/* 2. Recessed matte charcoal dial face */}
      <mesh position={[0, 0, 0.0]}>
        <circleGeometry args={[1.92, 128]} />
        <meshStandardMaterial
          color={dialColor}
          roughness={0.82}
          metalness={0.16}
        />
      </mesh>

      {/* 3. Subtle inner concentric instrument rings & crosshairs */}
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.18, 1.195, 128]} />
        <meshBasicMaterial color={isLight ? 0x2e2d2a : 0x262624} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[0.58, 0.592, 96]} />
        <meshBasicMaterial color={isLight ? 0x282724 : 0x222220} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[2.35, 0.006]} />
        <meshBasicMaterial color={isLight ? 0x262522 : 0x1e1e1c} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.006, 2.35]} />
        <meshBasicMaterial color={isLight ? 0x262522 : 0x1e1e1c} />
      </mesh>

      {/* 4. Raised machined outer bezel */}
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[2.0, 0.12, 24, 128]} />
        <meshStandardMaterial
          color={bezelColor}
          roughness={isLight ? 0.3 : 0.26}
          metalness={isLight ? 0.85 : 0.92}
        />
      </mesh>

      {/* Inner chamfer bezel ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[1.86, 1.92, 128]} />
        <meshStandardMaterial
          color={chamferColor}
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>

      {/* Bezel knurling lines */}
      <lineSegments geometry={bezelTicksGeo}>
        <lineBasicMaterial color={isLight ? 0x3a3936 : 0x222220} />
      </lineSegments>

      {/* 5. Fixed 12 o'clock Lubber Line */}
      <mesh geometry={lubberGeo} position={[0, 0, 0.09]}>
        <meshStandardMaterial
          color={COLORS.THREE.accent}
          emissive={COLORS.THREE.accent}
          emissiveIntensity={0.45}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* 6. Central metallic cap / hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.11]}>
        <cylinderGeometry args={[0.14, 0.16, 0.06, 48]} />
        <meshStandardMaterial
          color={isLight ? 0x454440 : 0x2a2a26}
          roughness={0.26}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[0, 0, 0.145]}>
        <sphereGeometry args={[0.09, 32, 32]} />
        <meshStandardMaterial
          color={isLight ? COLORS.THREE_LIGHT.hub : COLORS.THREE.hub}
          roughness={0.18}
          metalness={0.94}
        />
      </mesh>

      {/* 7. Glass surface & subtle rim reflection */}
      <mesh position={[0, 0, 0.17]} renderOrder={10}>
        <circleGeometry args={[1.88, 128]} />
        <meshPhysicalMaterial
          color={isLight ? COLORS.THREE_LIGHT.glassColor : COLORS.THREE.glassColor}
          roughness={0.05}
          metalness={0.0}
          transmission={0.92}
          transparent={true}
          opacity={isLight ? 0.09 : 0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Specular glass rim ring */}
      <mesh position={[0, 0, 0.175]} renderOrder={11}>
        <ringGeometry args={[1.855, 1.88, 128]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={isLight ? 0.24 : 0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
