'use client'

import type { ValidationReport } from '../validate'

export function ValidationBadge({ report }: { report: ValidationReport }) {
  const ok = report.ok
  return (
    <div
      style={{
        marginTop: 16,
        border: `1px solid ${ok ? '#bfe3cc' : '#f0d7a8'}`,
        background: ok ? '#effaf2' : '#fdf6e7',
        color: ok ? '#1d6b3d' : '#7a5a12',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        display: 'inline-block',
      }}
    >
      <strong style={{ marginRight: 8 }}>{ok ? '✓ map verified' : '⚠ map drift'}</strong>
      agent declares {report.declaredCount} page{report.declaredCount === 1 ? '' : 's'} ·{' '}
      {report.foundCount} exist on disk
      {report.missing.length > 0 && <> · {report.missing.length} missing</>}
      {report.undeclared.length > 0 && <> · {report.undeclared.length} undeclared</>}
      {!ok && (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          {report.missing.length > 0 && <div>missing on disk: {report.missing.join(', ')}</div>}
          {report.undeclared.length > 0 && (
            <div>not declared in agent-map.md: {report.undeclared.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  )
}
