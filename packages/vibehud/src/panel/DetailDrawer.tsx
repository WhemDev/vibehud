'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { AgentMap } from '../schema'
import { normalizeRoute, type ValidationReport } from '../validate'
import { statusColor, theme } from './theme'
import type { ApiHealth } from './useApiHealth'

export type Selection = { kind: 'page' | 'api' | 'task' | 'system' | 'flow'; id: string } | null

const drawer: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: 340,
  boxSizing: 'border-box',
  background: theme.card,
  borderLeft: `${theme.bw}px solid ${theme.line}`,
  padding: '20px 22px',
  overflowY: 'auto',
  zIndex: 50,
  fontFamily: theme.fontBody,
  color: theme.ink,
}

const kindChip: CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: theme.tagBg,
  color: theme.tagInk,
  padding: '2px 8px',
}

const h2: CSSProperties = {
  fontFamily: theme.fontHead,
  fontSize: 19,
  fontWeight: 800,
  textTransform: 'uppercase',
  margin: '10px 0 2px',
  letterSpacing: '0.02em',
}

const secTitle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: theme.muted,
  margin: '18px 0 8px',
  borderBottom: `${theme.bw}px solid ${theme.line}`,
  paddingBottom: 4,
}

const mono: CSSProperties = { fontFamily: theme.fontMono, fontSize: 12 }

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        border: `${theme.bw}px solid ${statusColor[status] ?? theme.line}`,
        color: statusColor[status] ?? theme.ink,
        padding: '1px 8px',
        marginLeft: 8,
      }}
    >
      {status}
    </span>
  )
}

function Row({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 13,
        padding: '6px 8px',
        border: `1px solid ${theme.line}`,
        marginBottom: 6,
        cursor: onClick ? 'pointer' : 'default',
        background: theme.card,
      }}
    >
      {children}
    </div>
  )
}

export function DetailDrawer({
  map,
  report,
  selection,
  onSelect,
  onClose,
  health,
}: {
  map: AgentMap
  report?: ValidationReport
  selection: Exclude<Selection, null>
  onSelect: (s: Selection) => void
  onClose: () => void
  health?: Record<string, ApiHealth>
}) {
  const page = selection.kind === 'page' ? map.pages.find((p) => p.id === selection.id) : undefined
  const api = selection.kind === 'api' ? map.apis.find((a) => a.id === selection.id) : undefined
  const task = selection.kind === 'task' ? map.tasks.find((t) => t.id === selection.id) : undefined
  const system =
    selection.kind === 'system' ? map.systems.find((s) => s.id === selection.id) : undefined
  const flow = selection.kind === 'flow' ? map.flows.find((f) => f.id === selection.id) : undefined
  const entity = page ?? api ?? task ?? system ?? flow
  if (!entity) return null

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
  const apiHealth = api ? health?.[api.id] : undefined

  const relationsOut = map.relations.filter((r) => r.from === selection.id)
  const relationsIn = map.relations.filter((r) => r.to === selection.id)
  const pageTasks = page ? map.tasks.filter((t) => t.page === page.id) : []
  const path = page?.path ?? api?.path
  const isMissing =
    path !== undefined &&
    (page
      ? report?.missing.includes(normalizeRoute(path))
      : report?.apiMissing.includes(normalizeRoute(path)))

  return (
    <aside style={drawer} aria-label="detail panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={kindChip}>{selection.kind}</span>
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            background: theme.card,
            border: `${theme.bw}px solid ${theme.line}`,
            boxShadow: theme.shadowSmall,
            fontFamily: theme.fontBody,
            fontWeight: 800,
            fontSize: 13,
            width: 28,
            height: 28,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <h2 style={h2}>{page?.label ?? api?.label ?? system?.label ?? flow?.label ?? 'Task'}</h2>
      {task && <div style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>}
      <div style={{ marginTop: 6 }}>
        {path && <span style={mono}>{path}</span>}
        {'status' in entity && <StatusPill status={entity.status} />}
      </div>

      {isMissing && (
        <div
          style={{
            marginTop: 12,
            background: theme.warnBg,
            border: `${theme.bw}px solid ${theme.line}`,
            boxShadow: theme.shadowSmall,
            padding: '8px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ⚠ Declared in agent-map.md but not found on disk.
        </div>
      )}

      {api && (
        <>
          <div style={secTitle}>Methods</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {api.methods.map((m) => (
              <span key={m} style={{ ...mono, ...kindChip }}>
                {m}
              </span>
            ))}
          </div>
          {apiHealth && apiHealth !== 'unknown' && (
            <>
              <div style={secTitle}>Health</div>
              <div style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background:
                      apiHealth === 'up' ? theme.ok : apiHealth === 'down' ? theme.muted : theme.danger,
                    border: `1.5px solid ${theme.line}`,
                  }}
                />
                {apiHealth === 'up'
                  ? 'responding'
                  : apiHealth === 'error'
                    ? 'responding with 5xx errors'
                    : apiHealth === 'missing'
                      ? 'returns 404'
                      : 'not reachable'}
              </div>
            </>
          )}
        </>
      )}

      {system?.kind && (
        <>
          <div style={secTitle}>Kind</div>
          <span style={{ ...mono, ...kindChip }}>{system.kind}</span>
        </>
      )}

      {flow && (
        <>
          <div style={secTitle}>Steps</div>
          {flow.steps.map((s, i) => (
            <Row
              key={i}
              onClick={
                s.uses ? () => onSelect({ kind: kindOf(s.uses!), id: s.uses! }) : undefined
              }
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: statusColor[s.status],
                  marginRight: 8,
                }}
              />
              {i + 1}. {s.label}
              {s.uses && (
                <span style={{ ...mono, fontSize: 10, color: theme.muted, marginLeft: 8 }}>
                  → {labelOf(s.uses)}
                </span>
              )}
              {s.note && (
                <div style={{ fontSize: 11, color: theme.muted, marginTop: 3 }}>{s.note}</div>
              )}
            </Row>
          ))}
        </>
      )}

      {page?.elements && page.elements.length > 0 && (
        <>
          <div style={secTitle}>Made of</div>
          {page.elements.map((el, i) => (
            <Row key={i}>
              {el.status && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: statusColor[el.status],
                    marginRight: 8,
                  }}
                />
              )}
              <b>{el.name}</b>
              {el.kind && (
                <span style={{ ...mono, fontSize: 10, color: theme.muted, marginLeft: 8 }}>
                  {el.kind}
                </span>
              )}
            </Row>
          ))}
        </>
      )}

      {(relationsOut.length > 0 || relationsIn.length > 0) && (
        <>
          <div style={secTitle}>Connections</div>
          {relationsOut.map((r, i) => (
            <Row key={`o${i}`} onClick={() => onSelect({ kind: kindOf(r.to), id: r.to })}>
              → <b>{labelOf(r.to)}</b>
              <span style={{ ...mono, fontSize: 10, color: theme.muted, marginLeft: 8 }}>{r.type}</span>
            </Row>
          ))}
          {relationsIn.map((r, i) => (
            <Row key={`i${i}`} onClick={() => onSelect({ kind: kindOf(r.from), id: r.from })}>
              ← <b>{labelOf(r.from)}</b>
              <span style={{ ...mono, fontSize: 10, color: theme.muted, marginLeft: 8 }}>{r.type}</span>
            </Row>
          ))}
        </>
      )}

      {pageTasks.length > 0 && (
        <>
          <div style={secTitle}>Tasks on this page</div>
          {pageTasks.map((t) => (
            <Row key={t.id} onClick={() => onSelect({ kind: 'task', id: t.id })}>
              {t.title}
              <StatusPill status={t.status} />
            </Row>
          ))}
        </>
      )}

      {task?.page && (
        <>
          <div style={secTitle}>Belongs to</div>
          <Row onClick={() => onSelect({ kind: 'page', id: task.page! })}>
            <b>{labelOf(task.page)}</b>
          </Row>
        </>
      )}

      {(page?.note ?? api?.note ?? system?.note ?? flow?.note) && (
        <>
          <div style={secTitle}>Note</div>
          <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            {page?.note ?? api?.note ?? system?.note ?? flow?.note}
          </p>
        </>
      )}
    </aside>
  )
}
