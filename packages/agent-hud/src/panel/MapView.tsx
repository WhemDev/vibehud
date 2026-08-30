'use client'

import type { AgentMap, PageNode } from '../schema'
import { normalizeRoute, type ValidationReport } from '../validate'

const NODE_W = 150
const NODE_H = 52
const COL_GAP = 220
const ROW_GAP = 78
const PAD = 24

const STATUS_COLOR: Record<string, string> = {
  done: '#2e9e5b',
  doing: '#e8a531',
  todo: '#b0b0b0',
}

interface Positioned {
  page: PageNode
  x: number
  y: number
}

/** BFS layering from the root page ('/' if declared, else the first page). */
function layout(map: AgentMap): Positioned[] {
  const byId = new Map(map.pages.map((p) => [p.id, p]))
  const children = new Map<string, string[]>()
  for (const r of map.relations) {
    if (!byId.has(r.from) || !byId.has(r.to)) continue
    children.set(r.from, [...(children.get(r.from) ?? []), r.to])
  }

  const root = map.pages.find((p) => normalizeRoute(p.path) === '/') ?? map.pages[0]
  const layerOf = new Map<string, number>()
  if (root) {
    const queue: string[] = [root.id]
    layerOf.set(root.id, 0)
    while (queue.length) {
      const id = queue.shift()!
      for (const child of children.get(id) ?? []) {
        if (!layerOf.has(child)) {
          layerOf.set(child, layerOf.get(id)! + 1)
          queue.push(child)
        }
      }
    }
  }
  const maxLayer = Math.max(0, ...layerOf.values())
  for (const p of map.pages) {
    if (!layerOf.has(p.id)) layerOf.set(p.id, maxLayer + 1)
  }

  const rows = new Map<number, number>()
  const out: Positioned[] = []
  for (const p of map.pages) {
    const layer = layerOf.get(p.id)!
    const row = rows.get(layer) ?? 0
    rows.set(layer, row + 1)
    out.push({ page: p, x: PAD + layer * COL_GAP, y: PAD + row * ROW_GAP })
  }
  return out
}

export function MapView({ map, report }: { map: AgentMap; report?: ValidationReport }) {
  const nodes = layout(map)
  const pos = new Map(nodes.map((n) => [n.page.id, n]))
  const missing = new Set(report?.missing ?? [])

  const width = Math.max(...nodes.map((n) => n.x + NODE_W), 300) + PAD
  const height = Math.max(...nodes.map((n) => n.y + NODE_H), 120) + PAD

  if (map.pages.length === 0) {
    return <p style={{ fontSize: 14, color: '#888' }}>No pages declared yet.</p>
  }

  return (
    <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e2e2', borderRadius: 8 }}>
      <svg width={width} height={height} role="img" aria-label="Page map">
        <defs>
          <marker id="hud-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#bbb" />
          </marker>
        </defs>
        {map.relations.map((r, i) => {
          const a = pos.get(r.from)
          const b = pos.get(r.to)
          if (!a || !b) return null
          return (
            <line
              key={i}
              x1={a.x + NODE_W}
              y1={a.y + NODE_H / 2}
              x2={b.x}
              y2={b.y + NODE_H / 2}
              stroke="#ccc"
              strokeWidth={1.5}
              strokeDasharray={r.type === 'nav' ? undefined : '4 3'}
              markerEnd="url(#hud-arrow)"
            />
          )
        })}
        {nodes.map(({ page, x, y }) => {
          const isMissing = missing.has(normalizeRoute(page.path))
          return (
            <g key={page.id}>
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill="#fff"
                stroke={isMissing ? '#d64545' : '#d5d5d5'}
                strokeWidth={isMissing ? 2 : 1.5}
                strokeDasharray={isMissing ? '5 3' : undefined}
              />
              <circle cx={x + 14} cy={y + 18} r={4.5} fill={STATUS_COLOR[page.status]} />
              <text x={x + 26} y={y + 22} fontSize={13} fontWeight={600} fill="#222">
                {page.label}
              </text>
              <text x={x + 26} y={y + 40} fontSize={11} fill={isMissing ? '#d64545' : '#999'}>
                {isMissing ? `${page.path} · missing` : page.path}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
