import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EnvVar } from './schema'

export interface EnvVarStatus {
  name: string
  /** Present in .env.example (always true when no example file exists). */
  inExample: boolean
  /** Actually set in the running process (value never leaves the server). */
  set: boolean
  note?: string
}

export interface EnvReport {
  vars: EnvVarStatus[]
  /** Names in .env.example that the map does not declare. */
  exampleUndeclared: string[]
  /** Whether a .env.example file was found at all. */
  hasExample: boolean
}

const LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/

/** Reads variable NAMES from .env.example / .env.local.example. Never values. */
export function scanEnvExample(root: string): string[] | null {
  const files = ['.env.example', '.env.local.example'].map((f) => join(root, f))
  const found = files.filter((f) => existsSync(f))
  if (found.length === 0) return null
  const names = new Set<string>()
  for (const file of found) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(LINE_RE)
      if (m) names.add(m[1])
    }
  }
  return [...names].sort()
}

export function buildEnvReport(
  declared: EnvVar[],
  exampleNames: string[] | null,
  isSet: (name: string) => boolean,
): EnvReport {
  const example = new Set(exampleNames ?? [])
  const declaredNames = new Set(declared.map((v) => v.name))
  return {
    hasExample: exampleNames !== null,
    vars: declared.map((v) => ({
      name: v.name,
      inExample: exampleNames === null ? true : example.has(v.name),
      set: isSet(v.name),
      ...(v.note ? { note: v.note } : {}),
    })),
    exampleUndeclared: [...example].filter((n) => !declaredNames.has(n)).sort(),
  }
}
