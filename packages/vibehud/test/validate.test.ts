import { describe, expect, it } from 'vitest'
import type { AgentMap } from '../src/schema'
import { validateMap } from '../src/validate'

function mapWith(paths: string[]): AgentMap {
  return {
    version: 1,
    pages: paths.map((p, i) => ({ id: `p${i}`, label: p, path: p, status: 'done' as const })),
    apis: [],
    systems: [],
    flows: [],
    env: [],
    relations: [],
    tasks: [],
  }
}

describe('validateMap', () => {
  it('reports a clean match', () => {
    const r = validateMap(mapWith(['/', '/about']), ['/', '/about'])
    expect(r.ok).toBe(true)
    expect(r.matched).toEqual(['/', '/about'])
    expect(r.missing).toEqual([])
    expect(r.undeclared).toEqual([])
  })

  it('reports missing (declared but not on disk) and undeclared (on disk, not declared)', () => {
    const r = validateMap(mapWith(['/', '/wishlist']), ['/', '/account', '/orders'])
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['/wishlist'])
    expect(r.undeclared).toEqual(['/account', '/orders'])
  })

  it('normalizes trailing slashes and missing leading slashes', () => {
    const r = validateMap(mapWith(['about/', 'blog']), ['/about', '/blog'])
    expect(r.ok).toBe(true)
  })

  it('ignores the hud route itself by default', () => {
    const r = validateMap(mapWith(['/']), ['/', '/vibehud'])
    expect(r.undeclared).toEqual([])
    expect(r.ok).toBe(true)
  })

  it('matches dynamic routes literally', () => {
    const r = validateMap(mapWith(['/blog/[slug]']), ['/blog/[slug]'])
    expect(r.ok).toBe(true)
  })
})
