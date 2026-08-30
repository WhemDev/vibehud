import { parse as parseYaml } from 'yaml'
import { type AgentMap, normalizeMap } from './schema'

export interface ParseResult {
  map?: AgentMap
  warnings: string[]
  error?: string
}

const FENCE_RE = /^```[ \t]*(ya?ml)([^\n`]*)\n([\s\S]*?)\n```[ \t]*$/gim

/**
 * Extracts the agent-map YAML block from a markdown document.
 * Prefers a fence whose info string mentions "agent-map"; otherwise the first
 * yaml/yml fence in the file.
 */
export function parseAgentMap(markdown: string): ParseResult {
  const blocks: { info: string; body: string }[] = []
  for (const m of markdown.matchAll(FENCE_RE)) {
    blocks.push({ info: m[2].trim().toLowerCase(), body: m[3] })
  }
  if (blocks.length === 0) {
    return {
      warnings: [],
      error: 'no yaml block found — add a ```yaml agent-map fenced block to agent-map.md',
    }
  }
  const block = blocks.find((b) => b.info.includes('agent-map')) ?? blocks[0]

  let raw: unknown
  try {
    raw = parseYaml(block.body)
  } catch (err) {
    return { warnings: [], error: `YAML parse error: ${(err as Error).message}` }
  }

  const { map, warnings } = normalizeMap(raw)
  return { map, warnings }
}
