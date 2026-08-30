'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Re-runs the server render on an interval so agent edits to agent-map.md
 * (and new route files) appear live, without a full page reload.
 */
export function AutoRefresh({ ms }: { ms: number }) {
  const router = useRouter()
  useEffect(() => {
    if (ms <= 0) return
    const id = setInterval(() => router.refresh(), ms)
    return () => clearInterval(id)
  }, [ms, router])
  return null
}
