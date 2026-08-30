import { describe, expect, it } from 'vitest'
import { parseAgentMap } from '../src/parser'
import { validateMap } from '../src/validate'

const parse = (yaml: string) => parseAgentMap('```yaml agent-map\n' + yaml + '\n```').map!

describe('self-route ignore', () => {
  it('filters the HUD route from the DECLARED set too — declaring it is harmless', () => {
    const map = parse(`version: 1
pages:
  - id: home
    path: /
  - id: hud
    path: /vibehud`)
    const r = validateMap(map, { pages: ['/', '/vibehud'], apis: [] })
    expect(r.ok).toBe(true)
    expect(r.missing).toEqual([])
    expect(r.undeclared).toEqual([])
    expect(r.declaredCount).toBe(1)
  })
})

describe('method-level drift', () => {
  const map = parse(`version: 1
pages: []
apis:
  - id: a
    path: /api/products
    methods: [GET]
  - id: b
    path: /api/checkout
    methods: [POST]`)

  it('flags declared methods that differ from the handler exports', () => {
    const r = validateMap(map, {
      pages: [],
      apis: [
        { path: '/api/products', methods: ['GET', 'POST'] },
        { path: '/api/checkout', methods: ['POST'] },
      ],
    })
    expect(r.ok).toBe(false)
    expect(r.methodMismatches).toEqual([
      { path: '/api/products', declared: ['GET'], found: ['GET', 'POST'] },
    ])
  })

  it('does not flag missing routes twice (mismatch only for matched paths)', () => {
    const r = validateMap(map, { pages: [], apis: [{ path: '/api/checkout', methods: ['POST'] }] })
    expect(r.apiMissing).toEqual(['/api/products'])
    expect(r.methodMismatches).toEqual([])
  })
})

describe('dangling id lint', () => {
  it('reports relations and task links pointing at unknown ids', () => {
    const map = parse(`version: 1
pages:
  - id: home
    path: /
relations:
  - from: home
    to: shop
tasks:
  - id: t1
    title: "Grid"
    status: doing
    page: products`)
    const r = validateMap(map, { pages: ['/'], apis: [] })
    expect(r.ok).toBe(false)
    expect(r.dangling).toEqual([
      'relation home → shop: unknown id "shop"',
      'task "Grid": unknown page id "products"',
    ])
  })

  it('accepts references to apis and systems', () => {
    const map = parse(`version: 1
pages:
  - id: home
    path: /
apis:
  - id: api1
    path: /api/x
systems:
  - id: db
relations:
  - from: home
    to: api1
  - from: api1
    to: db`)
    const r = validateMap(map, { pages: ['/'], apis: [{ path: '/api/x', methods: ['GET'] }] })
    expect(r.dangling).toEqual([])
  })
})
