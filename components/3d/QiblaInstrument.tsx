'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'
import { angleDifference } from '@/lib/geo/GeoEngine'

interface QiblaInstrumentProps {
  currentHeading: number
  qiblaBearing: number
  tiltX: number
  tiltY: number
  motionMode: 'full' | 'reduced'
}

export default function QiblaInstrument(props: QiblaInstrumentProps) {
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
        <directionalLight position={[-3, 4, 4]} intensity={1.4} color="#FFF8F0" />
        <pointLight position={[3, -3, 2]} intensity={0.5} color="#B0C8FF" />
        <QiblaDial {...props} />
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
}: QiblaInstrumentProps) {
  const tiltGroupRef = useRef<THREE.Group>(null)
  const spireGroupRef = useRef<THREE.Group>(null)
  const stateRef = useRef({
    relAngle: angleDifference(currentHeading, qiblaBearing),
  })

  // Tapered architectural Qibla spire pointer with 3D ridge
  const spireGeo = useMemo(() => {
    const pos = new Float32Array([
      // Left facet
      0,     1.54, 0.02,
      -0.18, 0.15, 0.02,
      0,     0.35, 0.09,
      // Right facet
      0,     1.54, 0.02,
      0,     0.35, 0.09,
      0.18,  0.15, 0.02,
      // Lower left tail
      -0.18, 0.15, 0.02,
      0,    -0.55, 0.02,
      0,     0.35, 0.09,
      // Lower right tail
      0,     0.35, 0.09,
      0,    -0.55, 0.02,
      0.18,  0.15, 0.02,
    ])
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  // Subtle 8-point geometric star inlay on dial face
  const octagramGeo = useMemo(() => {
    const positions: number[] = []
    const r = 1.38
    const pts = 8
    for (let i = 0; i < pts; i++) {
      const a1 = (i * Math.PI * 2) / pts
      const a2 = (((i + 3) % pts) * Math.PI * 2) / pts
      positions.push(
        Math.sin(a1) * r,
        Math.cos(a1) * r,
        0.008,
        Math.sin(a2) * r,
        Math.cos(a2) * r,
        0.008
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useEffect(() => {
    return () => {
      spireGeo.dispose()
      octagramGeo.dispose()
    }
  }, [spireGeo, octagramGeo])

  const diff = angleDifference(currentHeading, qiblaBearing)
  const isAligned = Math.abs(diff) < 2

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = stateRef.current
    const desired = angleDifference(currentHeading, qiblaBearing)
    const d = angleDifference(s.relAngle, desired)
    s.relAngle += d * Math.min(1, dt * 12)

    if (spireGroupRef.current) {
      spireGroupRef.current.rotation.z = -(s.relAngle * Math.PI) / 180
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
      {/* Outer casing */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <cylinderGeometry args={[2.05, 2.1, 0.24, 96]} />
        <meshStandardMaterial color={COLORS.THREE.casingDark} roughness={0.32} metalness={0.88} />
      </mesh>

      {/* Bezel */}
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[1.92, 0.095, 24, 96]} />
        <meshStandardMaterial color={COLORS.THREE.bezzel} roughness={0.25} metalness={0.92} />
      </mesh>

      {/* Dial face */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.86, 96]} />
        <meshStandardMaterial color={0x0c0c0b} roughness={0.8} metalness={0.16} />
      </mesh>

      {/* Geometric octagram inlay */}
      <lineSegments geometry={octagramGeo}>
        <lineBasicMaterial color={isAligned ? COLORS.THREE.accent : 0x262622} />
      </lineSegments>

      {/* Outer alignment ring */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[1.7, 1.725, 96]} />
        <meshBasicMaterial color={isAligned ? COLORS.THREE.accent : 0x3a3a36} />
      </mesh>

      {/* Top 12 o'clock Kaaba index cube */}
      <mesh position={[0, 1.74, 0.06]}>
        <boxGeometry args={[0.12, 0.12, 0.08]} />
        <meshStandardMaterial
          color={isAligned ? COLORS.THREE.accent : 0x1a1a18}
          emissive={COLORS.THREE.accent}
          emissiveIntensity={isAligned ? 0.9 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Rotating Qibla Spire Pointer */}
      <group ref={spireGroupRef} position={[0, 0, 0.03]}>
        <mesh geometry={spireGeo}>
          <meshStandardMaterial
            color={COLORS.THREE.accent}
            emissive={COLORS.THREE.accent}
            emissiveIntensity={isAligned ? 0.65 : 0.2}
            roughness={0.22}
            metalness={0.78}
          />
        </mesh>
      </group>

      {/* Center hub */}
      <mesh position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color={COLORS.THREE.hub} roughness={0.18} metalness={0.95} />
      </mesh>
    </group>
  )
}
