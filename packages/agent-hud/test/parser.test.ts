import { describe, expect, it } from 'vitest'
import { parseAgentMap } from '../src/parser'

const good = `# My App map

Some prose for humans.

\`\`\`yaml agent-map
version: 1
app: "Blogfolio"
pages:
  - id: home
    label: Home
    path: /
    status: done
  - id: blog
    path: /blog
relations:
  - from: home
    to: blog
tasks:
  - id: t1
    title: Write posts
    status: doing
    page: blog
\`\`\`
`

describe('parseAgentMap', () => {
  it('parses a fenced yaml agent-map block', () => {
    const { map, error } = parseAgentMap(good)
    expect(error).toBeUndefined()
    expect(map?.app).toBe('Blogfolio')
    expect(map?.pages).toHaveLength(2)
    expect(map?.pages[0]).toEqual({ id: 'home', label: 'Home', path: '/', status: 'done' })
    expect(map?.pages[1]).toEqual({ id: 'blog', label: 'blog', path: '/blog', status: 'done' })
    expect(map?.relations[0]).toEqual({ from: 'home', to: 'blog', type: 'nav' })
    expect(map?.tasks[0]).toEqual({ id: 't1', title: 'Write posts', status: 'doing', page: 'blog' })
  })

  it('accepts a plain ```yml fence when no agent-map block exists', () => {
    const md = 'intro\n\n```yml\nversion: 1\npages:\n  - id: a\n    path: /a\n```\n'
    const { map, error } = parseAgentMap(md)
    expect(error).toBeUndefined()
    expect(map?.pages[0].id).toBe('a')
  })

  it('prefers the block tagged agent-map over an earlier yaml block', () => {
    const md =
      '```yaml\nnot: the map\n```\n\n```yaml agent-map\nversion: 1\npages:\n  - id: real\n    path: /real\n```\n'
    const { map } = parseAgentMap(md)
    expect(map?.pages[0].id).toBe('real')
  })

  it('reports a friendly error when no block exists', () => {
    const { map, error } = parseAgentMap('# just prose')
    expect(map).toBeUndefined()
    expect(error).toMatch(/no yaml/i)
  })

  it('reports YAML syntax errors', () => {
    const { map, error } = parseAgentMap('```yaml\npages: [unclosed\n```\n')
    expect(map).toBeUndefined()
    expect(error).toBeTruthy()
  })

  it('drops invalid entries with warnings instead of crashing', () => {
    const md = `\`\`\`yaml
version: 1
pages:
  - id: ok
    path: /ok
  - label: no id or path
relations:
  - from: ok
tasks:
  - id: t1
    title: fine
    status: nonsense
unknownkey: whatever
\`\`\`
`
    const { map, warnings } = parseAgentMap(md)
    expect(map?.pages).toHaveLength(1)
    expect(map?.relations).toHaveLength(0)
    expect(map?.tasks[0].status).toBe('todo')
    expect(warnings.length).toBeGreaterThanOrEqual(3)
  })
})
