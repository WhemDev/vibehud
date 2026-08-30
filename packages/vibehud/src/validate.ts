import type { AgentMap } from './schema'
import type { ScannedApp } from './scanner'

export interface MethodMismatch {
  path: string
  declared: string[]
  found: string[]
}

export interface ValidationReport {
  ok: boolean
  /** Page paths that are both declared and present on disk. */
  matched: string[]
  /** Declared in agent-map.md but no route exists. */
  missing: string[]
  /** Route exists on disk but is not declared. */
  undeclared: string[]
  declaredCount: number
  foundCount: number
  /** Same three buckets for API routes. */
  apiMatched: string[]
  apiMissing: string[]
  apiUndeclared: string[]
  apiDeclaredCount: number
  apiFoundCount: number
  /** Matched API routes whose declared methods differ from the handler's exports. */
  methodMismatches: MethodMismatch[]
  /** relations/tasks referencing ids that don't exist in the map. */
  dangling: string[]
}

export interface ValidateOptions {
  /** Routes to exclude from the comparison. Defaults to the HUD's own route. */
  ignore?: string[]
}

export function normalizeRoute(p: string): string {
  let out = p.trim()
  if (!out.startsWith('/')) out = '/' + out
  if (out.length > 1) out = out.replace(/\/+$/, '')
  return out
}

function diff(declared: Set<string>, found: Set<string>) {
  return {
    matched: [...declared].filter((d) => found.has(d)).sort(),
    missing: [...declared].filter((d) => !found.has(d)).sort(),
    undeclared: [...found].filter((f) => !declared.has(f)).sort(),
  }
}

function findDangling(map: AgentMap): string[] {
  const known = new Set([
    ...map.pages.map((p) => p.id),
    ...(map.apis ?? []).map((a) => a.id),
    ...(map.systems ?? []).map((s) => s.id),
  ])
  const out: string[] = []
  for (const r of map.relations) {
    if (!known.has(r.from)) out.push(`relation ${r.from} → ${r.to}: unknown id "${r.from}"`)
    if (!known.has(r.to)) out.push(`relation ${r.from} → ${r.to}: unknown id "${r.to}"`)
  }
  for (const t of map.tasks) {
    if (t.page && !known.has(t.page)) out.push(`task "${t.title}": unknown page id "${t.page}"`)
  }
  for (const f of map.flows ?? []) {
    for (const s of f.steps) {
      if (s.uses && !known.has(s.uses))
        out.push(`flow "${f.label}" step "${s.label}": unknown id "${s.uses}"`)
    }
  }
  return out
}

/**
 * Compares the declared pages (and, when a full ScannedApp is given, the
 * declared API routes and their methods) against what actually exists on
 * disk, and checks referential integrity of relations and task links.
 *
 * Ignored routes (the HUD's own, by default) are filtered from BOTH sides:
 * declaring the HUD route is neither required nor penalized.
 */
export function validateMap(
  map: AgentMap,
  scanned: ScannedApp | string[],
  options: ValidateOptions = {},
): ValidationReport {
  const app: ScannedApp = Array.isArray(scanned) ? { pages: scanned, apis: [] } : scanned
  const checkApis = !Array.isArray(scanned)

  const ignore = new Set((options.ignore ?? ['/vibehud']).map(normalizeRoute))
  const declaredPages = new Set(
    map.pages.map((p) => normalizeRoute(p.path)).filter((r) => !ignore.has(r)),
  )
  const foundPages = new Set(app.pages.map(normalizeRoute).filter((r) => !ignore.has(r)))
  const pages = diff(declaredPages, foundPages)

  const declaredApis = new Set(
    (map.apis ?? []).map((a) => normalizeRoute(a.path)).filter((r) => !ignore.has(r)),
  )
  const foundApis = new Set(app.apis.map((a) => normalizeRoute(a.path)).filter((r) => !ignore.has(r)))
  const apis = checkApis
    ? diff(declaredApis, foundApis)
    : { matched: [], missing: [], undeclared: [] }

  const methodMismatches: MethodMismatch[] = []
  if (checkApis) {
    const foundByPath = new Map(app.apis.map((a) => [normalizeRoute(a.path), a.methods]))
    for (const declared of map.apis ?? []) {
      const path = normalizeRoute(declared.path)
      if (!apis.matched.includes(path)) continue
      const found = foundByPath.get(path) ?? []
      const a = [...declared.methods].sort().join(',')
      const b = [...found].sort().join(',')
      if (a !== b) {
        methodMismatches.push({ path, declared: [...declared.methods].sort(), found: [...found].sort() })
      }
    }
    methodMismatches.sort((x, y) => x.path.localeCompare(y.path))
  }

  const dangling = findDangling(map)

  return {
    ok:
      pages.missing.length === 0 &&
      pages.undeclared.length === 0 &&
      apis.missing.length === 0 &&
      apis.undeclared.length === 0 &&
      methodMismatches.length === 0 &&
      dangling.length === 0,
    matched: pages.matched,
    missing: pages.missing,
    undeclared: pages.undeclared,
    declaredCount: declaredPages.size,
    foundCount: foundPages.size,
    apiMatched: apis.matched,
    apiMissing: apis.missing,
    apiUndeclared: apis.undeclared,
    apiDeclaredCount: declaredApis.size,
    apiFoundCount: foundApis.size,
    methodMismatches,
    dangling,
  }
}
