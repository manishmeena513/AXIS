'use client'

import { useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'

export default function ServiceWorkerRegistrar() {
  // Ensure saved theme (dark / light / system) is applied immediately on every route load
  useTheme()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          reg.update().catch(() => {
            // Ignore offline update check
          })
        })
        .catch(() => {
          // Silent fail in restricted environments
        })
    }
  }, [])

  return null
}
