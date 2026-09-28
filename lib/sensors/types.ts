export interface OrientationReading {
  alpha: number | null  // compass heading 0–360 clockwise from North
  rawAlpha: number | null // raw browser alpha
  beta:  number | null  // pitch -180–180 (X rotation)
  gamma: number | null  // roll  -90–90  (Y rotation)
  absolute: boolean
  timestamp: number
}

export interface MotionReading {
  accelerationX: number | null
  accelerationY: number | null
  accelerationZ: number | null
  rotationRateAlpha: number | null
  rotationRateBeta:  number | null
  rotationRateGamma: number | null
  timestamp: number
}

export interface LocationReading {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
  timestamp: number
}

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'not-required'
  | 'unavailable'
  | 'prompt'

export interface SensorState {
  orientation: OrientationReading | null
  motion: MotionReading | null
  location: LocationReading | null
  permissionOrientation: PermissionStatus
  permissionMotion: PermissionStatus
  permissionLocation: PermissionStatus
  sensorAvailable: boolean
}
