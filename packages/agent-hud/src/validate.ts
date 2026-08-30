import type { AgentMap } from './schema'

export interface ValidationReport {
  ok: boolean
  /** Route paths that are both declared and present on disk. */
  matched: string[]
  /** Declared in agent-map.md but no route exists. */
  missing: string[]
  /** Route exists on disk but is not declared. */
  undeclared: string[]
  declaredCount: number
  foundCount: number
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

/** Compares the declared pages against the actual scanned routes. */
export function validateMap(
  map: AgentMap,
  routes: string[],
  options: ValidateOptions = {},
): ValidationReport {
  const ignore = new Set((options.ignore ?? ['/agent-hud']).map(normalizeRoute))
  const declared = new Set(map.pages.map((p) => normalizeRoute(p.path)))
  const found = new Set(routes.map(normalizeRoute).filter((r) => !ignore.has(r)))

  const matched = [...declared].filter((d) => found.has(d)).sort()
  const missing = [...declared].filter((d) => !found.has(d)).sort()
  const undeclared = [...found].filter((f) => !declared.has(f)).sort()

  return {
    ok: missing.length === 0 && undeclared.length === 0,
    matched,
    missing,
    undeclared,
    declaredCount: declared.size,
    foundCount: found.size,
  }
}
