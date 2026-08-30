'use client'

import type { CSSProperties } from 'react'
import type { AgentMap } from '../schema'
import type { ValidationReport } from '../validate'
import { KanbanView } from './KanbanView'
import { MapView } from './MapView'
import { FONTS_URL, theme } from './theme'
import { ValidationBadge } from './ValidationBadge'

export interface AgentHudPanelProps {
  map?: AgentMap
  report?: ValidationReport
  warnings?: string[]
  error?: string
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

export function AgentHudPanel({ map, report, warnings = [], error }: AgentHudPanelProps) {
  return (
    <div style={wrap}>
      <link rel="stylesheet" href={FONTS_URL} />
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
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
      </header>

      {error ? (
        <SetupScreen error={error} />
      ) : map ? (
        <>
          {report && <ValidationBadge report={report} />}
          <div>
            <div style={sectionTitle}>Map</div>
          </div>
          <MapView map={map} report={report} />
          <div>
            <div style={sectionTitle}>Tasks</div>
          </div>
          <KanbanView map={map} />
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
