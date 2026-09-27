/**
 * Design tokens as TypeScript constants.
 * Used for Three.js materials and other non-CSS contexts.
 */

export const COLORS = {
  // Background
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceRaised: '#1C1C1C',
  border: '#2A2A2A',

  // Accent
  accent: '#F59E0B',
  accentDim: '#92610A',
  accentGlow: 0xf59e0b, // Three.js hex

  // Text
  textPrimary: '#F5F5F0',
  textSecondary: '#8A8A85',
  textMuted: '#4A4A46',

  // Metallic
  metallicHi: '#D4D0C8',
  metallicLo: '#3A3A36',
  metallicMid: '#6A6A64',

  // Three.js material hex values
  THREE: {
    casingDark:   0x1a1a18,
    casingMid:    0x2a2a26,
    bezzel:       0x3a3a36,
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
  jitterThreshold:  0.1,  // degrees
  smoothingAlpha:   0.12,
  poorAccuracyStd:  8.0,  // degrees std deviation
  fairAccuracyStd:  3.0,
} as const
