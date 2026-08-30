'use client'

import type { EnvReport } from '../env'
import { theme } from './theme'

function Chip({
  name,
  tone,
  detail,
  dashed,
}: {
  name: string
  tone: 'ok' | 'warn' | 'danger' | 'muted'
  detail: string
  dashed?: boolean
}) {
  const color =
    tone === 'ok' ? theme.ok : tone === 'warn' ? theme.doing : tone === 'danger' ? theme.danger : theme.muted
  return (
    <span
      title={detail}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: `${theme.bw}px ${dashed ? 'dashed' : 'solid'} ${theme.line}`,
        boxShadow: dashed ? 'none' : theme.shadowSmall,
        background: theme.card,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily: theme.fontMono,
      }}
    >
      <span style={{ width: 9, height: 9, background: color, border: `1.5px solid ${theme.line}` }} />
      {name}
      <span style={{ fontSize: 10, color: tone === 'danger' ? theme.danger : theme.muted, fontFamily: theme.fontBody, fontWeight: 700 }}>
        {detail}
      </span>
    </span>
  )
}

export function EnvSection({ report }: { report: EnvReport }) {
  if (report.vars.length === 0 && report.exampleUndeclared.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {report.vars.map((v) => {
        const tone = !v.set ? 'danger' : !v.inExample ? 'warn' : 'ok'
        const detail = !v.set
          ? 'NOT SET'
          : !v.inExample
            ? 'set · missing from .env.example'
            : 'set'
        return <Chip key={v.name} name={v.name} tone={tone} detail={detail} />
      })}
      {report.exampleUndeclared.map((n) => (
        <Chip key={n} name={n} tone="muted" detail="in .env.example · not in map" dashed />
      ))}
    </div>
  )
}
