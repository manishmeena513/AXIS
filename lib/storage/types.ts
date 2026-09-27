export interface Settings {
  theme: 'dark' | 'light' | 'system'
  units: 'metric' | 'imperial'
  haptics: boolean
  sound: boolean
  compassPrecision: 0 | 1
  northMode: 'magnetic' | 'true'
  motionMode: 'full' | 'reduced'
  batteryMode: 'performance' | 'balanced' | 'saver'
}

export interface Waypoint {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude: number | null
  createdAt: number
  updatedAt: number
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  units: 'metric',
  haptics: true,
  sound: false,
  compassPrecision: 1,
  northMode: 'magnetic',
  motionMode: 'full',
  batteryMode: 'balanced',
}
