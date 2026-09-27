'use client'

import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/lib/design/tokens'

/**
 * 3D physical beveled compass needle in the XY plane.
 * North tip points to +Y (0°), South tip points to -Y (180°).
 * Built with 3D ridge height along +Z so directional lights create a real metallic split reflection.
 */
export default function CompassNeedle() {
  const { northGeo, southGeo } = useMemo(() => {
    const ridgeZ = 0.065
    const baseZ  = 0.015
    const halfW  = 0.115
    const length = 1.12

    // North half (2 triangles forming a 3D ridged pointer)
    const nPos = new Float32Array([
      // Left facet: tip -> center ridge -> left shoulder
      0,      length, baseZ,
      -halfW, 0,      baseZ,
      0,      0,      ridgeZ,
      // Right facet: tip -> right shoulder -> center ridge
      0,      length, baseZ,
      0,      0,      ridgeZ,
      halfW,  0,      baseZ,
    ])
    const nGeo = new THREE.BufferGeometry()
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3))
    nGeo.computeVertexNormals()

    // South half (2 triangles forming the counterweight pointer)
    const sPos = new Float32Array([
      // Left facet
      0,      -length, baseZ,
      0,      0,       ridgeZ,
      -halfW, 0,       baseZ,
      // Right facet
      0,      -length, baseZ,
      halfW,  0,       baseZ,
      0,      0,       ridgeZ,
    ])
    const sGeo = new THREE.BufferGeometry()
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
    sGeo.computeVertexNormals()

    return { northGeo: nGeo, southGeo: sGeo }
  }, [])

  useEffect(() => {
    return () => {
      northGeo.dispose()
      southGeo.dispose()
    }
  }, [northGeo, southGeo])

  return (
    <group position={[0, 0, 0.03]}>
      {/* North pointer — deep instrument red/amber */}
      <mesh geometry={northGeo}>
        <meshStandardMaterial
          color={COLORS.THREE.needleNorth}
          roughness={0.24}
          metalness={0.65}
        />
      </mesh>

      {/* South pointer — brushed silver/off-white */}
      <mesh geometry={southGeo}>
        <meshStandardMaterial
          color={COLORS.THREE.needleSouth}
          roughness={0.28}
          metalness={0.58}
        />
      </mesh>
    </group>
  )
}
