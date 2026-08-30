import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildEnvReport, scanEnvExample } from '../src/env'
import { diffMaps } from '../src/history'
import { parseAgentMap } from '../src/parser'

describe('env', () => {
  it('reads names (never values) from .env.example', () => {
    const root = mkdtempSync(join(tmpdir(), 'vibehud-env-'))
    writeFileSync(
      join(root, '.env.example'),
      '# comment\nSTRIPE_KEY=sk_test_xxx\nexport DATABASE_URL=postgres://x\nBAD LINE\n',
    )
    expect(scanEnvExample(root)).toEqual(['DATABASE_URL', 'STRIPE_KEY'])
  })

  it('returns null when no example file exists', () => {
    expect(scanEnvExample(mkdtempSync(join(tmpdir(), 'vibehud-env2-')))).toBeNull()
  })

  it('builds a report with set/inExample flags and undeclared names', () => {
    const r = buildEnvReport(
      [{ name: 'STRIPE_KEY' }, { name: 'RESEND_KEY', note: 'emails' }],
      ['STRIPE_KEY', 'DATABASE_URL'],
      (n) => n === 'STRIPE_KEY',
    )
    expect(r.vars).toEqual([
      { name: 'STRIPE_KEY', inExample: true, set: true },
      { name: 'RESEND_KEY', inExample: false, set: false, note: 'emails' },
    ])
    expect(r.exampleUndeclared).toEqual(['DATABASE_URL'])
    expect(r.hasExample).toBe(true)
  })

  it('treats everything as in-example when no example file exists', () => {
    const r = buildEnvReport([{ name: 'X' }], null, () => false)
    expect(r.vars[0].inExample).toBe(true)
    expect(r.hasExample).toBe(false)
  })
})

describe('diffMaps', () => {
  const parse = (yaml: string) => parseAgentMap('```yaml agent-map\n' + yaml + '\n```').map!

  it('summarizes structural changes', () => {
    const prev = parse(`version: 1
pages:
  - id: home
    path: /
tasks:
  - id: t1
    title: Ship it
    status: doing`)
    const curr = parse(`version: 1
pages:
  - id: home
    path: /
  - id: shop
    label: Shop
    path: /shop
apis:
  - id: pay
    label: Pay API
    path: /api/pay
env: [STRIPE_KEY]
tasks:
  - id: t1
    title: Ship it
    status: done
  - id: t2
    title: New thing
    status: todo`)
    expect(diffMaps(prev, curr)).toEqual([
      '+ page Shop',
      '+ API Pay API',
      'task done: "Ship it"',
      '+ task "New thing"',
      '+ env STRIPE_KEY',
    ])
  })

  it('caps long change lists', () => {
    const prev = parse('version: 1\npages: []')
    const curr = parse(
      'version: 1\npages:\n' +
        Array.from({ length: 10 }, (_, i) => `  - id: p${i}\n    path: /p${i}`).join('\n'),
    )
    const d = diffMaps(prev, curr)
    expect(d).toHaveLength(6)
    expect(d[5]).toMatch(/more change/)
  })
})
