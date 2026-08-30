'use client'

import type { AgentMap, Status } from '../schema'
import type { Selection } from './DetailDrawer'
import { theme } from './theme'

const COLUMNS: { key: Status; title: string }[] = [
  { key: 'todo', title: 'To do' },
  { key: 'doing', title: 'Doing' },
  { key: 'done', title: 'Done' },
]

export function KanbanView({
  map,
  onSelect,
}: {
  map: AgentMap
  onSelect?: (s: Selection) => void
}) {
  const pageLabel = new Map(map.pages.map((p) => [p.id, p.label]))

  if (map.tasks.length === 0) {
    return <p style={{ fontSize: 14, color: theme.muted }}>No tasks declared yet.</p>
  }

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {COLUMNS.map((col) => {
        const tasks = map.tasks.filter((t) => t.status === col.key)
        return (
          <div
            key={col.key}
            style={{
              flex: 1,
              minWidth: 190,
              background: theme.well,
              border: `${theme.bw}px solid ${theme.line}`,
              padding: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme.muted,
                margin: '2px 4px 10px',
              }}
            >
              {col.title} · {tasks.length}
            </div>
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelect?.({ kind: 'task', id: t.id })}
                style={{
                  cursor: onSelect ? 'pointer' : 'default',
                  background: theme.card,
                  border: `${theme.bw}px solid ${theme.line}`,
                  boxShadow: theme.shadowSmall,
                  padding: '8px 10px',
                  marginBottom: 10,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {t.title}
                {t.page && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: theme.tagInk,
                      background: theme.tagBg,
                      padding: '1px 7px',
                    }}
                  >
                    {pageLabel.get(t.page) ?? t.page}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
