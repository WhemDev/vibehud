'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { EnvReport } from '../env'
import type { HistoryEntry } from '../history'
import type { AgentMap } from '../schema'
import type { ValidationReport } from '../validate'
import { DetailDrawer, type Selection } from './DetailDrawer'
import { EnvSection } from './EnvSection'
import { HistoryStrip } from './HistoryStrip'
import { KanbanView } from './KanbanView'
import { MapView } from './MapView'
import { FONTS_URL, theme } from './theme'
import { useApiHealth } from './useApiHealth'
import { ValidationBadge } from './ValidationBadge'

export interface AgentHudPanelProps {
  map?: AgentMap
  report?: ValidationReport
  warnings?: string[]
  error?: string
  /** mtime of agent-map.md, ms since epoch — renders the freshness stamp. */
  updatedAt?: number
  envReport?: EnvReport
  history?: HistoryEntry[]
}

const wrap: CSSProperties = {
  fontFamily: theme.fontBody,
  color: theme.ink,
  background: theme.bg,
  minHeight: '100vh',
  padding: '28px',
  boxSizing: 'border-box',
}

const sectionTitle: CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: theme.tagInk,
  background: theme.tagBg,
  padding: '3px 10px',
  margin: '32px 0 12px',
}

function Freshness({ ts }: { ts: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (now === null) return null
  const s = Math.max(0, Math.round((now - ts) / 1000))
  const label = s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`
  const stale = s > 3600
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: theme.fontMono,
        color: stale ? theme.danger : theme.muted,
      }}
      title="How long ago the agent last touched agent-map.md"
    >
      updated {label} ago
    </span>
  )
}

function Progress({ map }: { map: AgentMap }) {
  const total = map.tasks.length
  if (total === 0) return null
  const done = map.tasks.filter((t) => t.status === 'done').length
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 140,
          height: 14,
          border: `${theme.bw}px solid ${theme.line}`,
          background: theme.card,
          display: 'inline-block',
        }}
        role="progressbar"
        aria-valuenow={done}
        aria-valuemax={total}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${(done / total) * 100}%`,
            background: theme.warnBg,
            borderRight: done > 0 && done < total ? `${theme.bw}px solid ${theme.line}` : 'none',
            boxSizing: 'border-box',
          }}
        />
      </span>
      <span style={{ fontSize: 12, fontWeight: 800 }}>
        {done}/{total} done
      </span>
    </span>
  )
}

export function AgentHudPanel({
  map,
  report,
  warnings = [],
  error,
  updatedAt,
  envReport,
  history = [],
}: AgentHudPanelProps) {
  const [selection, setSelection] = useState<Selection>(null)
  const [query, setQuery] = useState('')
  const health = useApiHealth(map?.apis ?? [])

  return (
    <div style={{ ...wrap, paddingRight: selection ? 340 + 28 : 28 }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <h1
          style={{
            fontFamily: theme.fontHead,
            fontSize: 24,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: 0,
          }}
        >
          {map?.app ?? 'Agent HUD'}
        </h1>
        <span style={{ fontSize: 12, color: theme.muted, fontFamily: theme.fontMono }}>
          agent-map.md
        </span>
        {updatedAt !== undefined && <Freshness ts={updatedAt} />}
        <span style={{ flex: 1 }} />
        {map && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="FILTER…"
            aria-label="Filter the map and tasks"
            style={{
              fontFamily: theme.fontMono,
              fontSize: 12,
              padding: '7px 10px',
              width: 150,
              border: `${theme.bw}px solid ${theme.line}`,
              boxShadow: theme.shadowSmall,
              background: theme.card,
              color: theme.ink,
              outline: 'none',
            }}
          />
        )}
        {map && <Progress map={map} />}
      </header>

      {error ? (
        <SetupScreen error={error} />
      ) : map ? (
        <>
          {report && <ValidationBadge report={report} />}
          {history.length > 0 && (
            <>
              <div>
                <div style={sectionTitle}>Recent changes</div>
              </div>
              <HistoryStrip history={history} />
            </>
          )}
          <div>
            <div style={sectionTitle}>Map</div>
          </div>
          <MapView
            map={map}
            report={report}
            selection={selection}
            onSelect={setSelection}
            query={query}
            health={health}
          />
          {envReport && (envReport.vars.length > 0 || envReport.exampleUndeclared.length > 0) && (
            <>
              <div>
                <div style={sectionTitle}>Env</div>
              </div>
              <EnvSection report={envReport} />
            </>
          )}
          <div>
            <div style={sectionTitle}>Tasks</div>
          </div>
          <KanbanView map={map} onSelect={setSelection} query={query} />
          {warnings.length > 0 && (
            <details style={{ marginTop: 28, fontSize: 12, color: theme.doing, fontWeight: 700 }}>
              <summary style={{ cursor: 'pointer' }}>
                {warnings.length} schema warning(s)
              </summary>
              <ul style={{ color: theme.muted, fontWeight: 500 }}>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          {selection && (
            <DetailDrawer
              map={map}
              report={report}
              selection={selection}
              onSelect={setSelection}
              onClose={() => setSelection(null)}
              health={health}
            />
          )}
        </>
      ) : (
        <SetupScreen />
      )}
    </div>
  )
}

function SetupScreen({ error }: { error?: string }) {
  return (
    <div style={{ marginTop: 32, maxWidth: 640 }}>
      <p style={{ fontSize: 15, fontWeight: 700 }}>
        {error
          ? `Could not read the map: ${error}`
          : 'No agent-map.md found at the project root.'}
      </p>
      <p style={{ fontSize: 14, color: theme.muted }}>
        Ask your agent to create <code style={{ fontFamily: theme.fontMono }}>agent-map.md</code>{' '}
        with a block like:
      </p>
      <pre
        style={{
          background: theme.card,
          border: `${theme.bw}px solid ${theme.line}`,
          boxShadow: theme.shadow,
          padding: 16,
          fontSize: 13,
          fontFamily: theme.fontMono,
          overflowX: 'auto',
        }}
      >
        {`\`\`\`yaml agent-map
version: 1
app: "My App"
pages:
  - id: home
    label: Home
    path: /
    status: done
tasks:
  - id: t1
    title: First task
    status: todo
\`\`\``}
      </pre>
    </div>
  )
}
