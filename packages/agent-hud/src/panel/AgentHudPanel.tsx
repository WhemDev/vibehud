'use client'

import type { CSSProperties } from 'react'
import type { AgentMap } from '../schema'
import type { ValidationReport } from '../validate'
import { KanbanView } from './KanbanView'
import { MapView } from './MapView'
import { ValidationBadge } from './ValidationBadge'

export interface AgentHudPanelProps {
  map?: AgentMap
  report?: ValidationReport
  warnings?: string[]
  error?: string
}

const wrap: CSSProperties = {
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  color: '#1a1a1a',
  background: '#fafafa',
  minHeight: '100vh',
  padding: '24px',
  boxSizing: 'border-box',
}

const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#888',
  margin: '28px 0 10px',
}

export function AgentHudPanel({ map, report, warnings = [], error }: AgentHudPanelProps) {
  return (
    <div style={wrap}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>{map?.app ?? 'Agent HUD'}</h1>
        <span style={{ fontSize: 12, color: '#999' }}>agent-map.md</span>
      </header>

      {error ? (
        <SetupScreen error={error} />
      ) : map ? (
        <>
          {report && <ValidationBadge report={report} />}
          <div style={sectionTitle}>Map</div>
          <MapView map={map} report={report} />
          <div style={sectionTitle}>Tasks</div>
          <KanbanView map={map} />
          {warnings.length > 0 && (
            <details style={{ marginTop: 24, fontSize: 12, color: '#996a00' }}>
              <summary>{warnings.length} schema warning(s)</summary>
              <ul>
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
      <p style={{ fontSize: 15 }}>
        {error
          ? `Could not read the map: ${error}`
          : 'No agent-map.md found at the project root.'}
      </p>
      <p style={{ fontSize: 14, color: '#666' }}>
        Ask your agent to create <code>agent-map.md</code> with a block like:
      </p>
      <pre
        style={{
          background: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: 6,
          padding: 16,
          fontSize: 13,
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
