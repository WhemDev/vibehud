'use client'

import type { AgentMap, Status } from '../schema'

const COLUMNS: { key: Status; title: string }[] = [
  { key: 'todo', title: 'To do' },
  { key: 'doing', title: 'Doing' },
  { key: 'done', title: 'Done' },
]

export function KanbanView({ map }: { map: AgentMap }) {
  const pageLabel = new Map(map.pages.map((p) => [p.id, p.label]))

  if (map.tasks.length === 0) {
    return <p style={{ fontSize: 14, color: '#888' }}>No tasks declared yet.</p>
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {COLUMNS.map((col) => {
        const tasks = map.tasks.filter((t) => t.status === col.key)
        return (
          <div
            key={col.key}
            style={{
              flex: 1,
              minWidth: 180,
              background: '#f1f1f1',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#777', margin: '2px 4px 10px' }}>
              {col.title} · {tasks.length}
            </div>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e2e2',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 8,
                  fontSize: 13,
                }}
              >
                {t.title}
                {t.page && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      fontSize: 11,
                      color: '#666',
                      background: '#eee',
                      borderRadius: 4,
                      padding: '1px 6px',
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
