import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanNextApp } from '../src/scanner'

function makeApp(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'agent-hud-api-'))
  for (const [f, content] of Object.entries(files)) {
    const full = join(root, f)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, content)
  }
  return root
}

describe('scanNextApp', () => {
  it('returns pages and api routes with their exported methods', () => {
    const app = makeApp({
      'page.tsx': 'export default function P() {}',
      'shop/page.tsx': 'export default function P() {}',
      'api/products/route.ts':
        'export async function GET() {}\nexport function POST() {}\n',
      'api/orders/[id]/route.ts': 'export const DELETE = () => {}\n',
    })
    const scanned = scanNextApp(app)
    expect(scanned.pages).toEqual(['/', '/shop'])
    expect(scanned.apis).toEqual([
      { path: '/api/orders/[id]', methods: ['DELETE'] },
      { path: '/api/products', methods: ['GET', 'POST'] },
    ])
  })

  it('defaults to GET when no method export is recognizable', () => {
    const app = makeApp({
      'api/misc/route.ts': 'import { handler } from "./x"\nexport { handler as GET }\n',
    })
    // re-exports are matched too; a truly opaque file falls back to GET
    const opaque = makeApp({ 'api/opaque/route.ts': 'module.exports = require("./x")\n' })
    expect(scanNextApp(app).apis[0].methods).toEqual(['GET'])
    expect(scanNextApp(opaque).apis[0].methods).toEqual(['GET'])
  })
})
