'use client'

import { useEffect, useState } from 'react'
import type { HistoryEntry } from '../history'
import { theme } from './theme'

function TimeAgo({ ts }: { ts: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => setNow(Date.now()), [])
  if (now === null) return null
  const s = Math.max(0, Math.round(now / 1000 - ts))
  const label =
    s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`
  return <>{label}</>
}

export function HistoryStrip({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {history.map((h) => (
        <div
          key={h.hash}
          style={{
            minWidth: 200,
            maxWidth: 260,
            background: theme.card,
            border: `${theme.bw}px solid ${theme.line}`,
            boxShadow: theme.shadowSmall,
            padding: '8px 12px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: h.hash === 'working' ? theme.doing : theme.muted,
              marginBottom: 6,
            }}
          >
            <span>{h.hash === 'working' ? '● uncommitted' : h.hash.slice(0, 7)}</span>
            <span style={{ fontFamily: theme.fontMono, fontWeight: 400, textTransform: 'none' }}>
              <TimeAgo ts={h.ts} />
            </span>
          </div>
          {h.changes.map((c, i) => (
            <div key={i} style={{ fontSize: 11.5, lineHeight: 1.5, fontFamily: theme.fontMono }}>
              {c}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
