'use client'

import { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'

interface LevelSceneProps {
  pitch: number
  roll: number
  isLevel: boolean
}

export default function LevelScene({ pitch, roll, isLevel }: LevelSceneProps) {
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
        <ambientLight intensity={0.25} />
        <directionalLight position={[-2.5, 3.5, 4]} intensity={1.4} color="#FFF8F0" />
        <pointLight position={[2.5, -3, 3]} intensity={0.5} color="#B0C8FF" />
        <SpiritBubbleAssembly pitch={pitch} roll={roll} isLevel={isLevel} />
      </Suspense>
    </Canvas>
  )
}

function SpiritBubbleAssembly({ pitch, roll, isLevel }: LevelSceneProps) {
  const bubbleGroupRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const posRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = posRef.current

    // In a physical spirit level, tilting right (+roll) causes the air bubble to float left (-x),
    // and tilting forward (+pitch) causes the bubble to float up (+y), clamped inside the chamber radius.
    const maxRadius = 1.28
    const rawX = (-roll / 25) * maxRadius
    const rawY = (pitch / 25) * maxRadius
    const dist = Math.hypot(rawX, rawY)
    const scale = dist > maxRadius ? maxRadius / dist : 1
    const targetX = rawX * scale
    const targetY = rawY * scale

    // Fluid-damped spring physics
    const stiffness = 95
    const damping = 14
    p.vx += ((targetX - p.x) * stiffness - p.vx * damping) * dt
    p.vy += ((targetY - p.y) * stiffness - p.vy * damping) * dt
    p.x += p.vx * dt
    p.y += p.vy * dt

    if (bubbleGroupRef.current) {
      bubbleGroupRef.current.position.set(p.x, p.y, 0.08)
    }
    if (shadowRef.current) {
      shadowRef.current.position.set(p.x * 1.03, p.y * 1.03, 0.008)
    }
  })

  return (
    <group>
      {/* 1. Outer metallic housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
        <cylinderGeometry args={[2.06, 2.1, 0.26, 96]} />
        <meshStandardMaterial color={COLORS.THREE.casingDark} roughness={0.32} metalness={0.88} />
      </mesh>

      {/* Raised machined bezel */}
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[1.92, 0.095, 24, 96]} />
        <meshStandardMaterial color={COLORS.THREE.bezzel} roughness={0.25} metalness={0.92} />
      </mesh>

      {/* 2. Recessed liquid chamber floor */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.86, 96]} />
        <meshStandardMaterial color={0x0c0e0c} roughness={0.72} metalness={0.2} />
      </mesh>

      {/* Crosshair hairlines */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[3.5, 0.008]} />
        <meshBasicMaterial color={0x242624} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.008, 3.5]} />
        <meshBasicMaterial color={0x242624} />
      </mesh>

      {/* Concentric calibration rings: center bullseye (tolerance), 5°, 15° */}
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[0.31, 0.34, 64]} />
        <meshBasicMaterial color={isLevel ? COLORS.THREE.accent : 0x8a8a85} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[0.78, 0.795, 96]} />
        <meshBasicMaterial color={0x2e2e2a} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.32, 1.335, 96]} />
        <meshBasicMaterial color={0x262622} />
      </mesh>

      {/* Bubble floor shadow */}
      <mesh ref={shadowRef} position={[0, 0, 0.008]}>
        <circleGeometry args={[0.27, 32]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.45} />
      </mesh>

      {/* 3. Physical 3D Glass Bubble */}
      <group ref={bubbleGroupRef} position={[0, 0, 0.08]}>
        {/* Outer translucent meniscal sphere */}
        <mesh scale={[1, 1, 0.55]}>
          <sphereGeometry args={[0.26, 48, 48]} />
          <meshPhysicalMaterial
            color={isLevel ? 0xf59e0b : 0xd4a84f}
            emissive={isLevel ? 0xf59e0b : 0x92610a}
            emissiveIntensity={isLevel ? 0.55 : 0.25}
            roughness={0.08}
            metalness={0.05}
            transmission={0.78}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Specular highlight bead on bubble dome */}
        <mesh position={[-0.08, 0.08, 0.12]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={0.75} />
        </mesh>
      </group>

      {/* 4. Domed instrument cover glass */}
      <mesh position={[0, 0, 0.16]} renderOrder={10}>
        <circleGeometry args={[1.86, 96]} />
        <meshPhysicalMaterial
          color={COLORS.THREE.glassColor}
          roughness={0.05}
          metalness={0.0}
          transmission={0.92}
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
