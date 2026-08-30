import type { AgentMap } from './schema'
import type { ScannedApp } from './scanner'

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

/**
 * Compares the declared pages (and, when a full ScannedApp is given, the
 * declared API routes) against what actually exists on disk.
 */
export function validateMap(
  map: AgentMap,
  scanned: ScannedApp | string[],
  options: ValidateOptions = {},
): ValidationReport {
  const app: ScannedApp = Array.isArray(scanned) ? { pages: scanned, apis: [] } : scanned
  const checkApis = !Array.isArray(scanned)

  const ignore = new Set((options.ignore ?? ['/vibehud']).map(normalizeRoute))
  const declaredPages = new Set(map.pages.map((p) => normalizeRoute(p.path)))
  const foundPages = new Set(app.pages.map(normalizeRoute).filter((r) => !ignore.has(r)))
  const pages = diff(declaredPages, foundPages)

  const declaredApis = new Set((map.apis ?? []).map((a) => normalizeRoute(a.path)))
  const foundApis = new Set(app.apis.map((a) => normalizeRoute(a.path)).filter((r) => !ignore.has(r)))
  const apis = checkApis
    ? diff(declaredApis, foundApis)
    : { matched: [], missing: [], undeclared: [] }

  return {
    ok:
      pages.missing.length === 0 &&
      pages.undeclared.length === 0 &&
      apis.missing.length === 0 &&
      apis.undeclared.length === 0,
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
  }
}
