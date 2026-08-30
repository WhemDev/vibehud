import { describe, expect, it } from 'vitest'
import { parseAgentMap } from '../src/parser'
import { validateMap } from '../src/validate'

const md = `\`\`\`yaml agent-map
version: 1
pages:
  - id: home
    path: /
apis:
  - id: products-api
    path: /api/products
    methods: [GET, POST]
  - id: wishlist-api
    path: /api/wishlist
    methods: [post]
\`\`\`
`

describe('validateMap with apis', () => {
  it('validates declared apis against scanned api routes', () => {
    const { map } = parseAgentMap(md)
    const r = validateMap(map!, {
      pages: ['/'],
      apis: [
        { path: '/api/products', methods: ['GET', 'POST'] },
        { path: '/api/orders', methods: ['GET'] },
      ],
    })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual([])
    expect(r.apiMatched).toEqual(['/api/products'])
    expect(r.apiMissing).toEqual(['/api/wishlist'])
    expect(r.apiUndeclared).toEqual(['/api/orders'])
  })

  it('normalizes api methods to uppercase and drops invalid entries', () => {
    const { map, warnings } = parseAgentMap(md)
    expect(map!.apis[1].methods).toEqual(['POST'])
    expect(warnings).toEqual([])
  })

  it('still accepts a plain routes array (pages only, back-compat)', () => {
    const { map } = parseAgentMap(md)
    const r = validateMap(map!, ['/'])
    expect(r.missing).toEqual([])
    expect(r.apiMissing).toEqual([])
  })

  it('parses page elements in string and object form', () => {
    const { map } = parseAgentMap(`\`\`\`yaml agent-map
version: 1
pages:
  - id: shop
    path: /shop
    elements:
      - ProductGrid
      - name: FilterBar
        kind: component
        status: doing
      - kind: broken-no-name
\`\`\`
`)
    expect(map!.pages[0].elements).toEqual([
      { name: 'ProductGrid' },
      { name: 'FilterBar', kind: 'component', status: 'doing' },
    ])
  })
})
