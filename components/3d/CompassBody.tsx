'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'

export default function CompassBody() {
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
    shape.moveTo(0, 1.76)      // bottom tip pointing inward at degree ring
    shape.lineTo(0.065, 1.93)  // top right
    shape.lineTo(-0.065, 1.93) // top left
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  return (
    <group>
      {/* 1. Outer metallic casing (cylinder oriented in XY plane via X-rotation) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.14]}>
        <cylinderGeometry args={[2.18, 2.22, 0.28, 128]} />
        <meshStandardMaterial
          color={COLORS.THREE.casingDark}
          roughness={0.32}
          metalness={0.88}
        />
      </mesh>

      {/* 2. Recessed matte charcoal dial face */}
      <mesh position={[0, 0, 0.0]}>
        <circleGeometry args={[1.92, 128]} />
        <meshStandardMaterial
          color={0x0c0c0b}
          roughness={0.78}
          metalness={0.18}
        />
      </mesh>

      {/* 3. Subtle inner concentric instrument rings */}
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.18, 1.195, 128]} />
        <meshBasicMaterial color={0x262624} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[0.58, 0.592, 96]} />
        <meshBasicMaterial color={0x222220} />
      </mesh>
      {/* Crosshair hairlines on dial face */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[2.35, 0.006]} />
        <meshBasicMaterial color={0x1e1e1c} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.006, 2.35]} />
        <meshBasicMaterial color={0x1e1e1c} />
      </mesh>

      {/* 4. Raised machined outer bezel */}
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[2.0, 0.12, 24, 128]} />
        <meshStandardMaterial
          color={COLORS.THREE.bezzel}
          roughness={0.26}
          metalness={0.92}
        />
      </mesh>

      {/* Inner chamfer bezel ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[1.86, 1.92, 128]} />
        <meshStandardMaterial
          color={0x252522}
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>

      {/* Bezel knurling lines */}
      <lineSegments geometry={bezelTicksGeo}>
        <lineBasicMaterial color={0x222220} />
      </lineSegments>

      {/* 5. Fixed 12 o'clock Lubber Line (index pointer) */}
      <mesh geometry={lubberGeo} position={[0, 0, 0.09]}>
        <meshStandardMaterial
          color={COLORS.THREE.accent}
          emissive={COLORS.THREE.accent}
          emissiveIntensity={0.45}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* 6. Central metallic cap / hub (above needle) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.11]}>
        <cylinderGeometry args={[0.14, 0.16, 0.06, 48]} />
        <meshStandardMaterial
          color={0x2a2a26}
          roughness={0.25}
          metalness={0.92}
        />
      </mesh>
      <mesh position={[0, 0, 0.145]}>
        <sphereGeometry args={[0.09, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.THREE.hub}
          roughness={0.16}
          metalness={0.96}
        />
      </mesh>

      {/* 7. Glass surface & subtle rim reflection */}
      <mesh position={[0, 0, 0.17]} renderOrder={10}>
        <circleGeometry args={[1.88, 128]} />
        <meshPhysicalMaterial
          color={COLORS.THREE.glassColor}
          roughness={0.04}
          metalness={0.0}
          transmission={0.92}
          transparent={true}
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Specular glass rim ring */}
      <mesh position={[0, 0, 0.175]} renderOrder={11}>
        <ringGeometry args={[1.855, 1.88, 128]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
