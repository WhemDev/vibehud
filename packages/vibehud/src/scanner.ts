import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const PAGE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js'])
const ROUTE_FILES = new Set(['route.tsx', 'route.ts', 'route.jsx', 'route.js'])
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export interface ScannedApi {
  path: string
  methods: string[]
}

export interface ScannedApp {
  pages: string[]
  apis: ScannedApi[]
}

/**
 * Walks a Next.js app directory and returns the routable pages and API route
 * handlers, sorted. Route groups `(name)` are collapsed, private `_folders`
 * and parallel-route `@slots` are skipped. Dynamic segments are kept literally
 * (`/blog/[slug]`). API methods are extracted from the handler's exports;
 * an unrecognizable file falls back to `['GET']`.
 */
export function scanNextApp(appDir: string): ScannedApp {
  const scanned: ScannedApp = { pages: [], apis: [] }
  try {
    if (!statSync(appDir).isDirectory()) return scanned
  } catch {
    return scanned
  }
  walk(appDir, [], scanned)
  scanned.pages.sort()
  scanned.apis.sort((a, b) => a.path.localeCompare(b.path))
  return scanned
}

/** Back-compat helper: just the page routes. */
export function scanNextAppRoutes(appDir: string): string[] {
  return scanNextApp(appDir).pages
}

function extractMethods(file: string): string[] {
  let src: string
  try {
    src = readFileSync(file, 'utf8')
  } catch {
    return ['GET']
  }
  const found = new Set<string>()
  const patterns = [
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g,
    /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*=/g,
    /export\s*\{[^}]*?\bas\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b[^}]*?\}/g,
  ]
  for (const re of patterns) {
    for (const m of src.matchAll(re)) found.add(m[1])
  }
  const methods = HTTP_METHODS.filter((m) => found.has(m))
  return methods.length > 0 ? methods : ['GET']
}

function walk(dir: string, segments: string[], scanned: ScannedApp): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }

  if (entries.some((e) => PAGE_FILES.has(e))) {
    scanned.pages.push('/' + segments.join('/'))
  }
  const routeFile = entries.find((e) => ROUTE_FILES.has(e))
  if (routeFile) {
    scanned.apis.push({
      path: '/' + segments.join('/'),
      methods: extractMethods(join(dir, routeFile)),
    })
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
    walk(full, isGroup ? segments : [...segments, entry], scanned)
  }
}
