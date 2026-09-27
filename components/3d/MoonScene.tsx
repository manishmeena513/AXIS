'use client'

import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'

interface MoonSceneProps {
  /** Normalized synodic phase in [0, 1): 0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Third Quarter */
  phase: number
}

/**
 * Generates an offline procedural lunar surface albedo + crater bump texture on an offscreen canvas.
 */
function createLunarSurfaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  if (ctx) {
    // Base lunar regolith tone
    ctx.fillStyle = '#B8B5AE'
    ctx.fillRect(0, 0, 512, 256)

    // Deterministic pseudo-random generator for craters and maria
    let seed = 4219
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    // Dark lunar maria patches
    for (let i = 0; i < 18; i++) {
      const x = rand() * 512
      const y = 40 + rand() * 176
      const r = 18 + rand() * 48
      const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r)
      grad.addColorStop(0, 'rgba(72, 70, 66, 0.55)')
      grad.addColorStop(1, 'rgba(72, 70, 66, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Impact craters with bright ejecta rims
    for (let i = 0; i < 160; i++) {
      const x = rand() * 512
      const y = 16 + rand() * 224
      const r = 1.5 + Math.pow(rand(), 3) * 18

      // Rim highlight
      ctx.strokeStyle = 'rgba(228, 225, 218, 0.35)'
      ctx.lineWidth = Math.max(0.8, r * 0.14)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()

      // Crater floor shadow
      ctx.fillStyle = 'rgba(65, 64, 60, 0.32)'
      ctx.beginPath()
      ctx.arc(x, y, r * 0.84, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

export default function MoonScene({ phase }: MoonSceneProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 4.3], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
      frameloop={isVisible ? 'always' : 'never'}
    >
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        <LunarSphere phase={phase} />
      </Suspense>
    </Canvas>
  )
}

function LunarSphere({ phase }: MoonSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    return createLunarSurfaceTexture()
  }, [])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  // Sun light vector orbiting around the Moon according to synodic phase:
  // phase = 0 (New Moon)     -> Sun behind Moon (0, 0, -6)
  // phase = 0.25 (1st Qtr)   -> Sun to right (+6, 0, 0)
  // phase = 0.5 (Full Moon)  -> Sun behind camera (0, 0, +6)
  // phase = 0.75 (3rd Qtr)   -> Sun to left (-6, 0, 0)
  const sunLightPos = useMemo((): [number, number, number] => {
    const theta = phase * Math.PI * 2
    const x = Math.sin(theta) * 6
    const z = -Math.cos(theta) * 6
    return [x, 0.35, z]
  }, [phase])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.045
    }
  })

  return (
    <group>
      {/* Subtle earthshine ambient light so the dark limb remains faintly visible */}
      <ambientLight intensity={0.045} color="#90A4C0" />

      {/* Directional solar illumination matching the exact lunar phase */}
      <directionalLight position={sunLightPos} intensity={2.6} color="#FFF8EB" />

      <mesh ref={meshRef}>
        <sphereGeometry args={[1.28, 64, 64]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          bumpMap={texture ?? undefined}
          bumpScale={0.025}
          roughness={0.88}
          metalness={0.04}
        />
      </mesh>
    </group>
  )
}
