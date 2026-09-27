import { openDB, IDBPDatabase } from 'idb'
import { Waypoint } from './types'

const DB_NAME = 'axis-db'
const DB_VERSION = 1
const STORE = 'waypoints'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export function sanitizeWaypointName(name: string): string {
  const cleaned = name.replace(/[<>]/g, '').trim().slice(0, 64)
  return cleaned || 'WAYPOINT'
}

export async function getAllWaypoints(): Promise<Waypoint[]> {
  if (typeof window === 'undefined') return []
  try {
    const db = await getDB()
    const list = await db.getAll(STORE)
    return (list as Waypoint[]).sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export async function getWaypointById(id: string): Promise<Waypoint | null> {
  if (typeof window === 'undefined') return null
  try {
    const db = await getDB()
    const item = await db.get(STORE, id)
    return (item as Waypoint) ?? null
  } catch {
    return null
  }
}

export async function saveWaypoint(waypoint: Waypoint): Promise<void> {
  if (typeof window === 'undefined') return
  const db = await getDB()
  await db.put(STORE, {
    ...waypoint,
    name: sanitizeWaypointName(waypoint.name),
  })
}

export async function updateWaypoint(
  id: string,
  patch: Partial<Pick<Waypoint, 'name' | 'latitude' | 'longitude' | 'altitude'>>
): Promise<Waypoint | null> {
  if (typeof window === 'undefined') return null
  const db = await getDB()
  const existing = (await db.get(STORE, id)) as Waypoint | undefined
  if (!existing) return null

  const updated: Waypoint = {
    ...existing,
    ...patch,
    name: patch.name !== undefined ? sanitizeWaypointName(patch.name) : existing.name,
    updatedAt: Date.now(),
  }
  await db.put(STORE, updated)
  return updated
}

export async function deleteWaypoint(id: string): Promise<void> {
  if (typeof window === 'undefined') return
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function clearAllWaypoints(): Promise<void> {
  if (typeof window === 'undefined') return
  const db = await getDB()
  await db.clear(STORE)
}

export function createWaypoint(
  name: string,
  latitude: number,
  longitude: number,
  altitude: number | null = null
): Waypoint {
  const now = Date.now()
  return {
    id: `wp_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: sanitizeWaypointName(name),
    latitude,
    longitude,
    altitude,
    createdAt: now,
    updatedAt: now,
  }
}
