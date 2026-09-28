'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'
import { useTheme } from '@/hooks/useTheme'

interface LevelSceneProps {
  pitch: number
  roll: number
  isLevel: boolean
}

export default function LevelScene({ pitch, roll, isLevel }: LevelSceneProps) {
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
        <ambientLight intensity={isLight ? 0.68 : 0.28} color={isLight ? '#FAF7F0' : '#FFFFFF'} />
        <directionalLight
          position={[-2.5, 3.8, 4.2]}
          intensity={isLight ? 1.85 : 1.45}
          color="#FFFDF8"
        />
        <directionalLight
          position={[3, -2.5, 3]}
          intensity={isLight ? 0.75 : 0.45}
          color={isLight ? '#E4ECF7' : '#B0C8FF'}
        />
        <SpiritBubbleAssembly pitch={pitch} roll={roll} isLevel={isLevel} isLight={isLight} />
      </Suspense>
    </Canvas>
  )
}

function SpiritBubbleAssembly({
  pitch,
  roll,
  isLevel,
  isLight,
}: LevelSceneProps & { isLight: boolean }) {
  const bubbleGroupRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const posRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

  // Radial degree scale ticks on the spirit level flange
  const flangeTicksGeo = useMemo(() => {
    const positions: number[] = []
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180
      const r1 = 1.66
      const r2 = deg % 90 === 0 ? 1.82 : deg % 45 === 0 ? 1.78 : 1.73
      positions.push(
        Math.sin(rad) * r1,
        Math.cos(rad) * r1,
        0.018,
        Math.sin(rad) * r2,
        Math.cos(rad) * r2,
        0.018
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useEffect(() => {
    return () => {
      flangeTicksGeo.dispose()
    }
  }, [flangeTicksGeo])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = posRef.current

    const maxRadius = 1.22
    const rawX = (-roll / 25) * maxRadius
    const rawY = (pitch / 25) * maxRadius
    const dist = Math.hypot(rawX, rawY)
    const scale = dist > maxRadius ? maxRadius / dist : 1
    const targetX = rawX * scale
    const targetY = rawY * scale

    const stiffness = 95
    const damping = 14
    p.vx += ((targetX - p.x) * stiffness - p.vx * damping) * dt
    p.vy += ((targetY - p.y) * stiffness - p.vy * damping) * dt
    p.x += p.vx * dt
    p.y += p.vy * dt

    if (bubbleGroupRef.current) {
      bubbleGroupRef.current.position.set(p.x, p.y, 0.085)
    }
    if (shadowRef.current) {
      shadowRef.current.position.set(p.x * 1.04 + 0.03, p.y * 1.04 - 0.03, 0.01)
    }
  })

  const chamberFloorColor = isLight ? 0xe5e2d7 : 0x121413
  const innerFlangeColor  = isLight ? 0xd4d0c4 : 0x1d1f1d
  const hairlineColor     = isLight ? 0x9e9a8e : 0x2c2e2c
  const ringOuterColor    = isLight ? 0x8a867a : 0x343634
  const centerRingColor   = isLevel
    ? isLight
      ? COLORS.THREE_LIGHT.accent
      : COLORS.THREE.accent
    : isLight
    ? 0x2c2b29
    : 0x9a9a94

  return (
    <group>
      {/* 1. Brushed graphite / metallic outer housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
        <cylinderGeometry args={[2.06, 2.1, 0.26, 96]} />
        <meshStandardMaterial
          color={isLight ? COLORS.THREE_LIGHT.casingOuter : COLORS.THREE.casingDark}
          roughness={0.34}
          metalness={0.84}
        />
      </mesh>

      {/* Raised brushed metal outer bezel */}
      <mesh position={[0, 0, 0.035]}>
        <torusGeometry args={[1.92, 0.1, 28, 128]} />
        <meshStandardMaterial
          color={isLight ? COLORS.THREE_LIGHT.bezelMetal : COLORS.THREE.bezzel}
          roughness={0.28}
          metalness={0.88}
        />
      </mesh>

      {/* Stepped metallic inner flange */}
      <mesh position={[0, 0, 0.012]}>
        <ringGeometry args={[1.64, 1.86, 128]} />
        <meshStandardMaterial
          color={innerFlangeColor}
          roughness={0.42}
          metalness={isLight ? 0.35 : 0.65}
        />
      </mesh>

      {/* Flange calibration ticks */}
      <lineSegments geometry={flangeTicksGeo}>
        <lineBasicMaterial color={isLight ? 0x4a4843 : 0x6a6a64} />
      </lineSegments>

      {/* 4 Machined Cardinal Calibration Notches on Bezel */}
      {[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180
        return (
          <mesh
            key={deg}
            position={[Math.sin(rad) * 1.92, Math.cos(rad) * 1.92, 0.095]}
            rotation={[0, 0, -rad]}
          >
            <boxGeometry args={[0.06, 0.14, 0.025]} />
            <meshStandardMaterial
              color={deg === 0 ? COLORS.THREE.accent : isLight ? 0x2c2b29 : 0xd4d0c8}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
        )
      })}

      {/* 2. Recessed liquid chamber floor (Ivory/stone optical chamber in Light Mode) */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.65, 128]} />
        <meshStandardMaterial
          color={chamberFloorColor}
          roughness={isLight ? 0.55 : 0.68}
          metalness={isLight ? 0.08 : 0.2}
        />
      </mesh>

      {/* Precision crosshair hairlines */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[3.28, 0.008]} />
        <meshBasicMaterial color={hairlineColor} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.008, 3.28]} />
        <meshBasicMaterial color={hairlineColor} />
      </mesh>

      {/* Concentric calibration rings: center bullseye (tolerance), 5°, 15° */}
      <mesh position={[0, 0, 0.007]}>
        <ringGeometry args={[0.31, 0.345, 64]} />
        <meshBasicMaterial color={centerRingColor} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[0.76, 0.778, 96]} />
        <meshBasicMaterial color={ringOuterColor} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[1.24, 1.258, 96]} />
        <meshBasicMaterial color={ringOuterColor} />
      </mesh>

      {/* Bubble floor shadow */}
      <mesh ref={shadowRef} position={[0.03, -0.03, 0.01]}>
        <circleGeometry args={[0.27, 32]} />
        <meshBasicMaterial
          color={0x000000}
          transparent
          opacity={isLight ? 0.16 : 0.42}
        />
      </mesh>

      {/* 3. Physical 3D Amber/Glass Meniscus Spirit Bubble */}
      <group ref={bubbleGroupRef} position={[0, 0, 0.085]}>
        {/* Dark metallic meniscus tension rim around bubble edge */}
        <mesh position={[0, 0, -0.02]}>
          <ringGeometry args={[0.245, 0.275, 48]} />
          <meshBasicMaterial
            color={isLevel ? 0xc98200 : isLight ? 0x4a3508 : 0xd49b2a}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Translucent golden-amber bubble body */}
        <mesh scale={[1, 1, 0.58]}>
          <sphereGeometry args={[0.26, 48, 48]} />
          <meshPhysicalMaterial
            color={isLevel ? 0xf59e0b : 0xe09612}
            emissive={isLevel ? 0xd97706 : 0x8a5200}
            emissiveIntensity={isLevel ? 0.5 : 0.28}
            roughness={0.06}
            metalness={0.08}
            transmission={0.72}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Specular highlight bead on bubble dome */}
        <mesh position={[-0.08, 0.08, 0.125]}>
          <sphereGeometry args={[0.048, 16, 16]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={0.88} />
        </mesh>
      </group>

      {/* 4. Domed instrument cover glass */}
      <mesh position={[0, 0, 0.165]} renderOrder={10}>
        <circleGeometry args={[1.86, 96]} />
        <meshPhysicalMaterial
          color={0xffffff}
          roughness={0.04}
          metalness={0.0}
          transmission={0.92}
          transparent
          opacity={isLight ? 0.11 : 0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
