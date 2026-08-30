'use client'

import { useState } from 'react'
import type { ValidationReport } from '../validate'
import { theme } from './theme'

function fixPrompt(report: ValidationReport): string {
  const lines = [
    'agent-map.md has drifted from the codebase. Update it so the HUD at /vibehud shows "map verified":',
  ]
  if (report.missing.length > 0)
    lines.push(
      `- Declared pages with no route on disk: ${report.missing.join(', ')} — either build these routes or remove them from the map.`,
    )
  if (report.undeclared.length > 0)
    lines.push(
      `- Routes on disk not declared in the map: ${report.undeclared.join(', ')} — add them to "pages".`,
    )
  if (report.apiMissing.length > 0)
    lines.push(
      `- Declared API routes with no handler on disk: ${report.apiMissing.join(', ')} — build them or remove them from "apis".`,
    )
  if (report.apiUndeclared.length > 0)
    lines.push(
      `- API handlers on disk not declared in the map: ${report.apiUndeclared.join(', ')} — add them to "apis".`,
    )
  for (const m of report.methodMismatches)
    lines.push(
      `- ${m.path} declares methods [${m.declared.join(', ')}] but the handler exports [${m.found.join(', ')}] — align the map's "methods".`,
    )
  if (report.dangling.length > 0)
    lines.push(`- Fix dangling references: ${report.dangling.join('; ')}.`)
  lines.push('Afterwards, keep agent-map.md updated in the same turn as any route or task change.')
  return lines.join('\n')
}

export function ValidationBadge({ report }: { report: ValidationReport }) {
  const ok = report.ok
  const [copied, setCopied] = useState(false)
  const hasApis = report.apiDeclaredCount > 0 || report.apiFoundCount > 0

  const copy = async () => {
    const text = fixPrompt(report)
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      // fallback for contexts without the async clipboard API
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        ok = document.execCommand('copy')
      } catch {
        ok = false
      }
      ta.remove()
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <div
        style={{
          marginTop: 18,
          border: `${theme.bw}px solid ${theme.line}`,
          boxShadow: theme.shadow,
          background: ok ? theme.okBg : theme.warnBg,
          color: theme.ink,
          padding: '10px 14px',
          fontSize: 13,
          display: 'inline-block',
        }}
      >
        <strong style={{ marginRight: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {ok ? '✓ map verified' : '⚠ map drift'}
        </strong>
        pages {report.declaredCount} declared · {report.foundCount} on disk
        {hasApis && (
          <>
            {' '}
            — APIs {report.apiDeclaredCount} declared · {report.apiFoundCount} on disk
          </>
        )}
        {!ok && (
          <div style={{ marginTop: 6, fontSize: 12, fontFamily: theme.fontMono }}>
            {report.missing.length > 0 && <div>pages missing on disk: {report.missing.join(', ')}</div>}
            {report.undeclared.length > 0 && <div>pages not declared: {report.undeclared.join(', ')}</div>}
            {report.apiMissing.length > 0 && <div>APIs missing on disk: {report.apiMissing.join(', ')}</div>}
            {report.apiUndeclared.length > 0 && <div>APIs not declared: {report.apiUndeclared.join(', ')}</div>}
            {report.methodMismatches.map((m) => (
              <div key={m.path}>
                method drift: {m.path} declares [{m.declared.join(', ')}] · exports [{m.found.join(', ')}]
              </div>
            ))}
            {report.dangling.map((d, i) => (
              <div key={i}>dangling: {d}</div>
            ))}
          </div>
        )}
      </div>
      {!ok && (
        <button
          onClick={copy}
          style={{
            marginTop: 18,
            border: `${theme.bw}px solid ${theme.line}`,
            boxShadow: theme.shadowSmall,
            background: copied ? theme.okBg : theme.tagBg,
            color: copied ? theme.ink : theme.tagInk,
            fontFamily: theme.fontBody,
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '10px 14px',
            cursor: 'pointer',
          }}
          title="Copies a prompt you can paste to your agent to reconcile the map"
        >
          {copied ? '✓ copied' : 'copy fix prompt'}
        </button>
      )}
    </div>
  )
}
