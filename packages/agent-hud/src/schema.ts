export type Status = 'todo' | 'doing' | 'done'
export type RelationType = 'nav' | 'data' | 'auth' | 'other'

export interface PageNode {
  id: string
  label: string
  path: string
  status: Status
}

export interface Relation {
  from: string
  to: string
  type: RelationType
}

export interface Task {
  id: string
  title: string
  status: Status
  page?: string
}

export interface AgentMap {
  version: number
  app?: string
  pages: PageNode[]
  relations: Relation[]
  tasks: Task[]
}

export interface NormalizeResult {
  map: AgentMap
  warnings: string[]
}

const STATUSES: Status[] = ['todo', 'doing', 'done']
const RELATION_TYPES: RelationType[] = ['nav', 'data', 'auth', 'other']
const KNOWN_KEYS = new Set(['version', 'app', 'pages', 'relations', 'tasks'])

function asString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim()
  if (typeof v === 'number') return String(v)
  return undefined
}

/**
 * Lenient normalization: agents emit variants, so invalid entries are dropped
 * with a warning and defaults are filled in — this never throws.
 */
export function normalizeMap(raw: unknown): NormalizeResult {
  const warnings: string[] = []
  const map: AgentMap = { version: 1, pages: [], relations: [], tasks: [] }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    warnings.push('agent-map block is not a YAML mapping; using an empty map')
    return { map, warnings }
  }
  const obj = raw as Record<string, unknown>

  for (const key of Object.keys(obj)) {
    if (!KNOWN_KEYS.has(key)) warnings.push(`ignoring unknown key "${key}"`)
  }

  if (typeof obj.version === 'number') map.version = obj.version
  else if (obj.version !== undefined) warnings.push('"version" should be a number')

  const app = asString(obj.app)
  if (app) map.app = app

  const seenPageIds = new Set<string>()
  for (const [i, entry] of toArray(obj.pages, 'pages', warnings).entries()) {
    const e = asObject(entry)
    const id = e && asString(e.id)
    const path = e && asString(e.path)
    if (!id || !path) {
      warnings.push(`pages[${i}] needs both "id" and "path"; dropped`)
      continue
    }
    if (seenPageIds.has(id)) {
      warnings.push(`pages[${i}] duplicates id "${id}"; dropped`)
      continue
    }
    seenPageIds.add(id)
    map.pages.push({
      id,
      path,
      label: asString(e.label) ?? id,
      status: normalizeStatus(e.status, 'done', `pages[${i}]`, warnings),
    })
  }

  for (const [i, entry] of toArray(obj.relations, 'relations', warnings).entries()) {
    const e = asObject(entry)
    const from = e && asString(e.from)
    const to = e && asString(e.to)
    if (!from || !to) {
      warnings.push(`relations[${i}] needs both "from" and "to"; dropped`)
      continue
    }
    let type: RelationType = 'nav'
    const rawType = e ? asString(e.type) : undefined
    if (rawType) {
      if ((RELATION_TYPES as string[]).includes(rawType)) type = rawType as RelationType
      else warnings.push(`relations[${i}] has unknown type "${rawType}"; using "nav"`)
    }
    map.relations.push({ from, to, type })
  }

  const seenTaskIds = new Set<string>()
  for (const [i, entry] of toArray(obj.tasks, 'tasks', warnings).entries()) {
    const e = asObject(entry)
    const id = e && asString(e.id)
    const title = e && asString(e.title)
    if (!id || !title) {
      warnings.push(`tasks[${i}] needs both "id" and "title"; dropped`)
      continue
    }
    if (seenTaskIds.has(id)) {
      warnings.push(`tasks[${i}] duplicates id "${id}"; dropped`)
      continue
    }
    seenTaskIds.add(id)
    const task: Task = {
      id,
      title,
      status: normalizeStatus(e?.status, 'todo', `tasks[${i}]`, warnings),
    }
    const page = e ? asString(e.page) : undefined
    if (page) task.page = page
    map.tasks.push(task)
  }

  return { map, warnings }
}

function toArray(v: unknown, key: string, warnings: string[]): unknown[] {
  if (v === undefined || v === null) return []
  if (Array.isArray(v)) return v
  warnings.push(`"${key}" should be a list; ignored`)
  return []
}

function asObject(v: unknown): Record<string, unknown> | undefined {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined
}

function normalizeStatus(
  v: unknown,
  fallback: Status,
  where: string,
  warnings: string[],
): Status {
  if (v === undefined || v === null) return fallback
  const s = asString(v)?.toLowerCase()
  if (s && (STATUSES as string[]).includes(s)) return s as Status
  warnings.push(`${where} has unknown status "${String(v)}"; using "${fallback}"`)
  return fallback
}
