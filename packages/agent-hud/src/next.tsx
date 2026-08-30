import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { parseAgentMap } from './parser'
import { AgentHudPanel } from './panel/AgentHudPanel'
import { scanNextAppRoutes } from './scanner'
import { validateMap, type ValidationReport } from './validate'

export interface AgentHudPageOptions {
  /** Project root holding agent-map.md. Default: walk up from cwd to find it. */
  root?: string
  /** State file name. Default: agent-map.md */
  file?: string
  /** Next.js app directory. Default: <root>/app or <root>/src/app. */
  appDir?: string
  /** Route the HUD itself is mounted on, excluded from validation. Default: /agent-hud */
  hudRoute?: string
}

function findRoot(start: string, file: string): string {
  let dir = start
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, file))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return start
}

/**
 * Server component for the generated app/agent-hud/page.tsx.
 * Reads agent-map.md, scans the app directory, validates, renders the panel.
 * Returns null (404-ish empty page) in production unless AGENT_HUD_ENABLE=1.
 */
export function AgentHudPage(options: AgentHudPageOptions = {}) {
  if (process.env.NODE_ENV === 'production' && process.env.AGENT_HUD_ENABLE !== '1') {
    return null
  }

  const file = options.file ?? 'agent-map.md'
  const root = options.root ?? findRoot(process.cwd(), file)
  const mapPath = join(root, file)

  if (!existsSync(mapPath)) {
    return <AgentHudPanel error={`${file} not found at ${root}`} />
  }

  const { map, warnings, error } = parseAgentMap(readFileSync(mapPath, 'utf8'))
  if (error || !map) {
    return <AgentHudPanel error={error ?? 'could not parse the map'} />
  }

  const appDir =
    options.appDir ??
    (existsSync(join(root, 'app')) ? join(root, 'app') : join(root, 'src', 'app'))

  let report: ValidationReport | undefined
  if (existsSync(appDir)) {
    report = validateMap(map, scanNextAppRoutes(appDir), {
      ignore: [options.hudRoute ?? '/agent-hud'],
    })
  } else {
    warnings.push(`no Next.js app directory found at ${appDir}; validation skipped`)
  }

  return <AgentHudPanel map={map} report={report} warnings={warnings} />
}
