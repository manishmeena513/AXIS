/**
 * Design tokens as TypeScript constants.
 * Includes separate 3D material & lighting presets for Dark and Light modes.
 */

export const COLORS = {
  // Background
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceRaised: '#1C1C1C',
  border: '#2A2A2A',

  // Accent
  accent: '#F59E0B',
  accentLightMode: '#C98200',
  accentDim: '#92610A',
  accentGlow: 0xf59e0b,

  // Text
  textPrimary: '#F5F5F0',
  textSecondary: '#8A8A85',
  textMuted: '#4A4A46',

  // Metallic
  metallicHi: '#D4D0C8',
  metallicLo: '#3A3A36',
  metallicMid: '#6A6A64',

  // Dark Mode Three.js material hex values
  THREE: {
    casingDark:   0x1a1a18,
    casingMid:    0x2a2a26,
    bezzel:       0x3a3a36,
    dialFace:     0x0d0d0c,
    glassColor:   0x88ccff,
    needleNorth:  0xc0392b,
    needleSouth:  0xf0eeea,
    hub:          0xd4d0c8,
    accent:       0xf59e0b,
    cardinalN:    0xf59e0b,
    cardinalRest: 0xd4d0c8,
    tickMajor:    0xd4d0c8,
    tickMinor:    0x6a6a64,
  },

  // Light Mode Three.js material hex values (Brushed Graphite / Stone / Anodized Metal)
  THREE_LIGHT: {
    casingOuter:  0x343330,
    bezelMetal:   0x54524d,
    bezelChamfer: 0x3e3d3a,
    dialDark:     0x141413,
    dialGraphite: 0x242321,
    dialStone:    0xe6e3da,
    dialStoneMid: 0xd5d1c6,
    glassColor:   0xffffff,
    needleNorth:  0xc83e2b,
    needleSouth:  0xe8e5dd,
    hub:          0xe2dfd7,
    accent:       0xd48800,
    tickDark:     0x2c2b29,
    tickMuted:    0x7a7770,
  },
} as const

export const TIMING = {
  compassLerp: {
    performance: 0.15,
    balanced:    0.10,
    saver:       0.06,
  },
  inertiaStrength: 0.05,
  parallaxStrength: 0.04,
} as const

export const SENSOR = {
  jitterThreshold: 0.1,
  smoothingAlpha:  0.12,
} as const
