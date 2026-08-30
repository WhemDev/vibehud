'use client'

import type { ValidationReport } from '../validate'
import { theme } from './theme'

export function ValidationBadge({ report }: { report: ValidationReport }) {
  const ok = report.ok
  return (
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
      agent declares {report.declaredCount} page{report.declaredCount === 1 ? '' : 's'} ·{' '}
      {report.foundCount} exist on disk
      {report.missing.length > 0 && <> · {report.missing.length} missing</>}
      {report.undeclared.length > 0 && <> · {report.undeclared.length} undeclared</>}
      {!ok && (
        <div style={{ marginTop: 6, fontSize: 12, fontFamily: theme.fontMono }}>
          {report.missing.length > 0 && <div>missing on disk: {report.missing.join(', ')}</div>}
          {report.undeclared.length > 0 && (
            <div>not declared in agent-map.md: {report.undeclared.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  )
}
