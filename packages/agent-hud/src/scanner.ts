import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const PAGE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js'])

/**
 * Walks a Next.js app directory and returns the routable page paths, sorted.
 * Route groups `(name)` are collapsed, private `_folders` and parallel-route
 * `@slots` are skipped. Dynamic segments are kept literally (`/blog/[slug]`).
 */
export function scanNextAppRoutes(appDir: string): string[] {
  const routes: string[] = []
  try {
    if (!statSync(appDir).isDirectory()) return []
  } catch {
    return []
  }
  walk(appDir, [], routes)
  return routes.sort()
}

function walk(dir: string, segments: string[], routes: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }

  if (entries.some((e) => PAGE_FILES.has(e))) {
    routes.push('/' + segments.join('/'))
  }

  for (const entry of entries) {
    if (entry.startsWith('_') || entry.startsWith('@') || entry.startsWith('.')) continue
    const full = join(dir, entry)
    let isDir = false
    try {
      isDir = statSync(full).isDirectory()
    } catch {
      continue
    }
    if (!isDir) continue
    const isGroup = entry.startsWith('(') && entry.endsWith(')')
    walk(full, isGroup ? segments : [...segments, entry], routes)
  }
}
