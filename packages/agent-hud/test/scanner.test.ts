import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanNextAppRoutes } from '../src/scanner'

function makeApp(files: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'agent-hud-scan-'))
  for (const f of files) {
    const full = join(root, f)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, 'export default function P() { return null }\n')
  }
  return root
}

describe('scanNextAppRoutes', () => {
  it('finds basic, nested, and dynamic routes', () => {
    const app = makeApp([
      'page.tsx',
      'about/page.tsx',
      'blog/page.tsx',
      'blog/[slug]/page.tsx',
      'docs/[...parts]/page.tsx',
      'shop/[[...filters]]/page.jsx',
    ])
    expect(scanNextAppRoutes(app)).toEqual([
      '/',
      '/about',
      '/blog',
      '/blog/[slug]',
      '/docs/[...parts]',
      '/shop/[[...filters]]',
    ])
  })

  it('collapses route groups and skips private and slot folders', () => {
    const app = makeApp([
      '(marketing)/pricing/page.tsx',
      '_internal/secret/page.tsx',
      '@modal/photo/page.tsx',
      'dashboard/page.tsx',
    ])
    expect(scanNextAppRoutes(app)).toEqual(['/dashboard', '/pricing'])
  })

  it('ignores non-page files and api route handlers', () => {
    const app = makeApp([
      'layout.tsx',
      'api/things/route.ts',
      'components/Button.tsx',
      'contact/page.ts',
    ])
    expect(scanNextAppRoutes(app)).toEqual(['/contact'])
  })

  it('returns empty for a missing directory', () => {
    expect(scanNextAppRoutes('/definitely/not/a/real/dir')).toEqual([])
  })
})
