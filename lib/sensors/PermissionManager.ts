import type { PermissionStatus } from './types'

type DeviceOrientationEventExtended = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

type DeviceMotionEventExtended = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function hasOrientationPermissionAPI(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as DeviceOrientationEventExtended).requestPermission === 'function'
  )
}

export function hasMotionPermissionAPI(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as DeviceMotionEventExtended).requestPermission === 'function'
  )
}

export async function requestOrientationPermission(): Promise<PermissionStatus> {
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
    return 'unavailable'
  }
  if (!hasOrientationPermissionAPI()) {
    return 'not-required'
  }

  try {
    const result = await (DeviceOrientationEvent as DeviceOrientationEventExtended).requestPermission!()
    return result === 'granted' ? 'granted' : 'denied'
  } catch {
    return 'denied'
  }
}

export async function requestMotionPermission(): Promise<PermissionStatus> {
  if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
    return 'unavailable'
  }
  if (!hasMotionPermissionAPI()) {
    return 'not-required'
  }

  try {
    const result = await (DeviceMotionEvent as DeviceMotionEventExtended).requestPermission!()
    return result === 'granted' ? 'granted' : 'denied'
  } catch {
    return 'denied'
  }
}

export function checkOrientationAvailability(): PermissionStatus {
  if (typeof window === 'undefined') return 'unavailable'
  if (typeof DeviceOrientationEvent === 'undefined') return 'unavailable'
  if (hasOrientationPermissionAPI()) return 'prompt'
  return 'not-required'
}
