'use client'

import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'

const RADIUS     = 1.78
const MAJOR_LEN  = 0.18  // every 45°
const MEDIUM_LEN = 0.12  // every 15°
const MINOR_LEN  = 0.065 // every 5°
const Z_OFFSET   = 0.015

const CARDINALS: Record<number, string> = {
  0: 'N', 45: 'NE', 90: 'E', 135: 'SE',
  180: 'S', 225: 'SW', 270: 'W', 315: 'NW',
}

interface DegreeRingProps {
  lockedHeading: number | null
  isAligned?: boolean
}

/**
 * Creates an offline, zero-network high-DPI CanvasTexture for dial markings.
 */
function createLabelTexture(text: string, color: string, bold = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128)
    ctx.fillStyle = color
    ctx.font = `${bold ? '700' : '500'} 54px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 64, 66)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function DialLabel({
  text,
  position,
  rotationZ,
  size,
  color,
  bold = true,
}: {
  text: string
  position: [number, number, number]
  rotationZ: number
  size: number
  color: string
  bold?: boolean
}) {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    return createLabelTexture(text, color, bold)
  }, [text, color, bold])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  if (!texture) return null

  return (
    <mesh position={position} rotation={[0, 0, rotationZ]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}

export default function DegreeRing({ lockedHeading, isAligned = false }: DegreeRingProps) {
  const tickGeometry = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []

    for (let deg = 0; deg < 360; deg += 5) {
      let tickLen = MINOR_LEN
      const color = new THREE.Color()

      if (deg === 0) {
        tickLen = MAJOR_LEN + 0.03
        color.setHex(COLORS.THREE.accent)
      } else if (deg % 45 === 0) {
        tickLen = MAJOR_LEN
        color.setHex(COLORS.THREE.tickMajor)
      } else if (deg % 15 === 0) {
        tickLen = MEDIUM_LEN
        color.setHex(COLORS.THREE.tickMajor)
        color.multiplyScalar(0.75)
      } else {
        color.setHex(COLORS.THREE.tickMinor)
      }

      const rad = (deg * Math.PI) / 180
      // In XY plane: 0° = +Y (12 o'clock), 90° = +X (3 o'clock)
      const sinR = Math.sin(rad)
      const cosR = Math.cos(rad)

      const x1 = sinR * RADIUS
      const y1 = cosR * RADIUS
      const x2 = sinR * (RADIUS - tickLen)
      const y2 = cosR * (RADIUS - tickLen)

      positions.push(x1, y1, Z_OFFSET, x2, y2, Z_OFFSET)
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [])

  useEffect(() => {
    return () => {
      tickGeometry.dispose()
    }
  }, [tickGeometry])

  return (
    <group>
      {/* Tick marks */}
      <lineSegments geometry={tickGeometry}>
        <lineBasicMaterial vertexColors />
      </lineSegments>

      {/* Cardinal & intercardinal labels */}
      {Object.entries(CARDINALS).map(([degStr, label]) => {
        const deg = parseInt(degStr, 10)
        const rad = (deg * Math.PI) / 180
        const isCardinal = deg % 90 === 0
        const isNorth = deg === 0
        const r = isCardinal ? RADIUS - 0.36 : RADIUS - 0.33
        const x = Math.sin(rad) * r
        const y = Math.cos(rad) * r

        return (
          <DialLabel
            key={label}
            text={label}
            position={[x, y, Z_OFFSET + 0.005]}
            rotationZ={-rad}
            size={isNorth ? 0.38 : isCardinal ? 0.32 : 0.22}
            color={isNorth ? '#F59E0B' : isCardinal ? '#F5F5F0' : '#8A8A85'}
            bold={isCardinal}
          />
        )
      })}

      {/* Degree numbers every 30° (excluding cardinals 0, 90, 180, 270) */}
      {Array.from({ length: 12 }, (_, i) => i * 30).map(deg => {
        if (deg % 90 === 0) return null
        const rad = (deg * Math.PI) / 180
        const r = RADIUS - 0.33
        const x = Math.sin(rad) * r
        const y = Math.cos(rad) * r
        return (
          <DialLabel
            key={`num-${deg}`}
            text={deg.toString()}
            position={[x, y, Z_OFFSET + 0.005]}
            rotationZ={-rad}
            size={0.21}
            color="#6A6A64"
            bold={false}
          />
        )
      })}

      {/* Lock target marker */}
      {lockedHeading !== null && (
        <LockMarker heading={lockedHeading} isAligned={isAligned} />
      )}
    </group>
  )
}

function LockMarker({ heading, isAligned }: { heading: number; isAligned: boolean }) {
  const rad = (heading * Math.PI) / 180
  const r = RADIUS - 0.06
  const x = Math.sin(rad) * r
  const y = Math.cos(rad) * r

  return (
    <group position={[x, y, Z_OFFSET + 0.025]} rotation={[0, 0, -rad]}>
      {/* Glowing amber target indicator on the degree ring */}
      <mesh>
        <circleGeometry args={[isAligned ? 0.085 : 0.065, 24]} />
        <meshStandardMaterial
          color={COLORS.THREE.accent}
          emissive={COLORS.THREE.accent}
          emissiveIntensity={isAligned ? 1.2 : 0.7}
        />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <ringGeometry args={[0.08, 0.115, 24]} />
        <meshBasicMaterial color={COLORS.THREE.accent} transparent opacity={isAligned ? 0.85 : 0.45} />
      </mesh>
    </group>
  )
}
