'use client'

import { useEffect, useState } from 'react'

export type ApiHealth = 'up' | 'error' | 'missing' | 'down' | 'unknown'

/**
 * Pings each declared API route with HEAD every `intervalMs` and reports
 * liveness. 2xx–4xx (except 404) counts as up — a 405 just means no HEAD
 * export. Dynamic paths ([param]) can't be pinged and stay 'unknown'.
 */
export function useApiHealth(
  paths: { id: string; path: string }[],
  intervalMs = 10000,
): Record<string, ApiHealth> {
  const [health, setHealth] = useState<Record<string, ApiHealth>>({})
  const key = paths.map((p) => `${p.id}:${p.path}`).join('|')

  useEffect(() => {
    let alive = true
    const targets = key === '' ? [] : key.split('|').map((s) => {
      const i = s.indexOf(':')
      return { id: s.slice(0, i), path: s.slice(i + 1) }
    })

    const ping = async () => {
      const results = await Promise.all(
        targets.map(async ({ id, path }): Promise<[string, ApiHealth]> => {
          if (path.includes('[')) return [id, 'unknown']
          try {
            const r = await fetch(path, { method: 'HEAD', cache: 'no-store' })
            if (r.status >= 500) return [id, 'error']
            if (r.status === 404) return [id, 'missing']
            return [id, 'up']
          } catch {
            return [id, 'down']
          }
        }),
      )
      if (alive) setHealth(Object.fromEntries(results))
    }

    ping()
    const timer = setInterval(ping, intervalMs)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [key, intervalMs])

  return health
}
