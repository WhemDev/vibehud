import { describe, expect, it } from 'vitest'
import { parseAgentMap } from '../src/parser'
import { validateMap } from '../src/validate'

const parse = (yaml: string) => parseAgentMap('```yaml agent-map\n' + yaml + '\n```')

describe('flows', () => {
  it('parses flows with object and string-shorthand steps', () => {
    const { map, warnings } = parse(`version: 1
pages:
  - id: checkout
    path: /checkout
apis:
  - id: checkout-api
    path: /api/checkout
    methods: [POST]
systems:
  - id: stripe
flows:
  - id: checkout-flow
    label: "Checkout pipeline"
    status: doing
    steps:
      - label: "Validate cart"
        status: done
      - label: "Create payment intent"
        uses: checkout-api
        status: done
      - label: "Stripe webhook"
        uses: stripe
        note: "signature check"
      - "Fulfill order"
      - kind: broken-no-label`)
    expect(warnings).toHaveLength(1)
    const f = map!.flows[0]
    expect(f.label).toBe('Checkout pipeline')
    expect(f.status).toBe('doing')
    expect(f.steps).toHaveLength(4)
    expect(f.steps[1]).toEqual({ label: 'Create payment intent', uses: 'checkout-api', status: 'done' })
    expect(f.steps[2].note).toBe('signature check')
    expect(f.steps[3]).toEqual({ label: 'Fulfill order', status: 'done' })
  })

  it('rejects duplicate flow ids across the shared id space', () => {
    const { map, warnings } = parse(`version: 1
pages:
  - id: checkout
    path: /checkout
flows:
  - id: checkout
    steps: ["A"]`)
    expect(map!.flows).toHaveLength(0)
    expect(warnings.some((w) => w.includes('duplicates'))).toBe(true)
  })

  it('flags step "uses" pointing at unknown ids via the validator', () => {
    const { map } = parse(`version: 1
pages:
  - id: home
    path: /
flows:
  - id: f1
    label: "Pipeline"
    steps:
      - label: "Step"
        uses: ghost-system`)
    const r = validateMap(map!, { pages: ['/'], apis: [] })
    expect(r.ok).toBe(false)
    expect(r.dangling).toEqual(['flow "Pipeline" step "Step": unknown id "ghost-system"'])
  })
})
