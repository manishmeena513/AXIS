'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllWaypoints,
  saveWaypoint,
  updateWaypoint,
  deleteWaypoint,
  clearAllWaypoints,
  createWaypoint,
} from '@/lib/storage/waypointStore'
import type { Waypoint } from '@/lib/storage/types'

export function useWaypoints() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await getAllWaypoints()
    setWaypoints(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addWaypoint = useCallback(
    async (name: string, latitude: number, longitude: number, altitude: number | null = null) => {
      const wp = createWaypoint(name, latitude, longitude, altitude)
      await saveWaypoint(wp)
      await refresh()
      return wp
    },
    [refresh]
  )

  const editWaypoint = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Waypoint, 'name' | 'latitude' | 'longitude' | 'altitude'>>
    ) => {
      const updated = await updateWaypoint(id, patch)
      await refresh()
      return updated
    },
    [refresh]
  )

  const removeWaypoint = useCallback(
    async (id: string) => {
      await deleteWaypoint(id)
      await refresh()
    },
    [refresh]
  )

  const clearAll = useCallback(async () => {
    await clearAllWaypoints()
    await refresh()
  }, [refresh])

  return {
    waypoints,
    loading,
    addWaypoint,
    editWaypoint,
    removeWaypoint,
    clearAll,
    refresh,
  }
}
