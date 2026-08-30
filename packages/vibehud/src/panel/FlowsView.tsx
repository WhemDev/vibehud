'use client'

import type { AgentMap } from '../schema'
import type { Selection } from './DetailDrawer'
import { statusColor, theme } from './theme'

/**
 * Backend pipelines: ordered step chains for the machinery that has no route
 * of its own (webhooks, jobs, emails). Steps with `uses` link to declared
 * pages/APIs/systems; clicking one opens that entity's drawer.
 */
export function FlowsView({
  map,
  onSelect,
  query = '',
}: {
  map: AgentMap
  onSelect?: (s: Selection) => void
  query?: string
}) {
  const q = query.trim().toLowerCase()
  const labelOf = (id: string) =>
    map.pages.find((p) => p.id === id)?.label ??
    map.apis.find((a) => a.id === id)?.label ??
    map.systems.find((s) => s.id === id)?.label ??
    id
  const kindOf = (id: string): 'page' | 'api' | 'system' =>
    map.apis.some((a) => a.id === id)
      ? 'api'
      : map.systems.some((s) => s.id === id)
        ? 'system'
        : 'page'
  const known = new Set([
    ...map.pages.map((p) => p.id),
    ...map.apis.map((a) => a.id),
    ...map.systems.map((s) => s.id),
  ])

  const flows = map.flows.filter(
    (f) =>
      q === '' ||
      f.label.toLowerCase().includes(q) ||
      f.steps.some((s) => s.label.toLowerCase().includes(q)),
  )
  if (flows.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {flows.map((flow) => (
        <div
          key={flow.id}
          style={{
            background: theme.card,
            border: `${theme.bw}px solid ${theme.line}`,
            boxShadow: theme.shadowSmall,
            padding: '10px 14px',
          }}
        >
          <div
            onClick={() => onSelect?.({ kind: 'flow', id: flow.id })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <span
              style={{ width: 9, height: 9, borderRadius: 99, background: statusColor[flow.status] }}
            />
            <b style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {flow.label}
            </b>
            <span style={{ fontFamily: theme.fontMono, fontSize: 10, color: theme.muted }}>
              {flow.steps.length} steps
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {flow.steps.map((step, i) => {
              const linked = step.uses && known.has(step.uses)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {i > 0 && (
                    <span style={{ margin: '0 6px', color: theme.muted, fontWeight: 800 }}>→</span>
                  )}
                  <div
                    onClick={
                      linked ? () => onSelect?.({ kind: kindOf(step.uses!), id: step.uses! }) : undefined
                    }
                    title={step.note}
                    style={{
                      background: theme.bg,
                      border: `${theme.bw}px solid ${step.uses && !linked ? theme.danger : theme.line}`,
                      borderStyle: step.uses && !linked ? 'dashed' : 'solid',
                      padding: '6px 10px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: linked && onSelect ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 7,
                        height: 7,
                        borderRadius: 99,
                        background: statusColor[step.status],
                        marginRight: 7,
                      }}
                    />
                    {step.label}
                    {step.uses && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: 8,
                          fontFamily: theme.fontMono,
                          fontSize: 9,
                          color: linked ? theme.tagInk : theme.danger,
                          background: linked ? theme.tagBg : 'transparent',
                          padding: '0 5px',
                        }}
                      >
                        {linked ? labelOf(step.uses) : `${step.uses}?`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
