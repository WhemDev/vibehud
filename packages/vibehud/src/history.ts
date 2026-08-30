import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseAgentMap } from './parser'
import type { AgentMap } from './schema'

export interface HistoryEntry {
  /** Commit hash, or "working" for uncommitted changes. */
  hash: string
  /** Unix seconds. */
  ts: number
  /** Human-readable change lines vs the previous version. */
  changes: string[]
}

const MAX_LINES = 6

/** Structural diff between two parsed maps, newest-relative. */
export function diffMaps(prev: AgentMap | undefined, curr: AgentMap): string[] {
  const out: string[] = []
  const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]))

  for (const [noun, prevXs, currXs] of [
    ['page', prev?.pages ?? [], curr.pages],
    ['API', prev?.apis ?? [], curr.apis],
    ['system', prev?.systems ?? [], curr.systems],
  ] as const) {
    const p = byId(prevXs as { id: string; label?: string }[])
    const c = byId(currXs as { id: string; label?: string }[])
    for (const [id, x] of c) if (!p.has(id)) out.push(`+ ${noun} ${x.label ?? id}`)
    for (const [id, x] of p) if (!c.has(id)) out.push(`− ${noun} ${x.label ?? id}`)
  }

  const prevTasks = byId(prev?.tasks ?? [])
  for (const t of curr.tasks) {
    const before = prevTasks.get(t.id)
    if (!before) out.push(`+ task "${t.title}"`)
    else if (before.status !== t.status) out.push(`task ${t.status}: "${t.title}"`)
  }
  for (const [id, t] of prevTasks) {
    if (!curr.tasks.some((x) => x.id === id)) out.push(`− task "${t.title}"`)
  }

  const prevEnv = new Set((prev?.env ?? []).map((v) => v.name))
  for (const v of curr.env) if (!prevEnv.has(v.name)) out.push(`+ env ${v.name}`)

  if (out.length > MAX_LINES) {
    const extra = out.length - (MAX_LINES - 1)
    out.length = MAX_LINES - 1
    out.push(`… ${extra} more change${extra === 1 ? '' : 's'}`)
  }
  return out
}

function git(root: string, args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

/**
 * Recent history of agent-map.md as structural diffs, newest first.
 * Includes an entry for uncommitted working-tree changes when present.
 * Returns [] when git or history is unavailable — never throws.
 */
export function getMapHistory(root: string, file = 'agent-map.md', limit = 4): HistoryEntry[] {
  try {
    const log = git(root, ['log', '-n', String(limit + 1), '--format=%H %ct', '--', file]).trim()
    if (!log) return []
    const commits = log.split('\n').map((l) => {
      const [hash, ts] = l.split(' ')
      return { hash, ts: Number(ts) }
    })

    const mapAt = (hash: string): AgentMap | undefined => {
      try {
        // "./" keeps the path relative to cwd — git show is repo-root-relative otherwise
        return parseAgentMap(git(root, ['show', `${hash}:./${file}`])).map
      } catch {
        return undefined
      }
    }

    const maps = commits.map((c) => mapAt(c.hash))
    const entries: HistoryEntry[] = []

    const workingMap = parseAgentMap(readFileSync(join(root, file), 'utf8')).map
    if (workingMap && maps[0]) {
      const changes = diffMaps(maps[0], workingMap)
      if (changes.length > 0) {
        entries.push({ hash: 'working', ts: Math.floor(statSync(join(root, file)).mtimeMs / 1000), changes })
      }
    }

    for (let i = 0; i < commits.length && entries.length < limit; i++) {
      if (!maps[i]) continue
      const changes = diffMaps(maps[i + 1], maps[i]!)
      if (changes.length > 0) entries.push({ hash: commits[i].hash, ts: commits[i].ts, changes })
    }
    return entries
  } catch {
    return []
  }
}
