'use client'

import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import CompassLighting from './CompassLighting'
import CompassBody from './CompassBody'
import DegreeRing from './DegreeRing'
import CompassNeedle from './CompassNeedle'
import CompassAnimator from './CompassAnimator'
import { shortestAngularDiff } from '@/lib/compass/CompassEngine'
import { useTheme } from '@/hooks/useTheme'

interface CompassSceneProps {
  heading:       number
  tiltX:         number
  tiltY:         number
  lockedHeading: number | null
  motionMode:    'full' | 'reduced'
  batteryMode:   'performance' | 'balanced' | 'saver'
}

export default function CompassScene(props: CompassSceneProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const isAligned =
    props.lockedHeading !== null &&
    Math.abs(shortestAngularDiff(props.heading, props.lockedHeading)) < 2

  return (
    <Canvas
      camera={{ position: [0, 0, 5.35], fov: 42 }}
      dpr={props.batteryMode === 'saver' ? [1, 1.25] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
      frameloop={isVisible ? 'always' : 'never'}
    >
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        <CompassLighting tiltX={props.tiltX} tiltY={props.tiltY} isLight={isLight} />
        <CompassAnimator
          heading={props.heading}
          tiltX={props.tiltX}
          tiltY={props.tiltY}
          motionMode={props.motionMode}
          batteryMode={props.batteryMode}
          bodyElement={<CompassBody isLight={isLight} />}
          ringElement={
            <>
              <DegreeRing lockedHeading={props.lockedHeading} isAligned={isAligned} />
              <CompassNeedle />
            </>
          }
        />
      </Suspense>
    </Canvas>
  )
}
