#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { buildEnvReport, scanEnvExample } from './env'
import { parseAgentMap } from './parser'
import { scanNextApp } from './scanner'
import { validateMap } from './validate'

const USAGE = `vibehud — validate agent-map.md against the real filesystem

Usage:
  npx vibehud check [options]

Options:
  --json             machine-readable output
  --root <path>      project root holding agent-map.md (default: cwd)
  --file <name>      state file name (default: agent-map.md)
  --app-dir <path>   Next.js app directory (default: <root>/app or <root>/src/app)
  --hud-route <p>    route to ignore in validation (default: /vibehud)

Exit codes: 0 clean · 1 drift or dangling refs · 2 setup problem`

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}

function fail(msg: string): never {
  console.error(`vibehud: ${msg}`)
  process.exit(2)
}

const [, , command] = process.argv
if (command !== 'check') {
  console.log(USAGE)
  process.exit(command === undefined || command === '--help' || command === 'help' ? 0 : 2)
}

const json = process.argv.includes('--json')
const root = resolve(arg('--root') ?? process.cwd())
const file = arg('--file') ?? 'agent-map.md'
const mapPath = join(root, file)
if (!existsSync(mapPath)) fail(`${file} not found at ${root}`)

const { map, warnings, error } = parseAgentMap(readFileSync(mapPath, 'utf8'))
if (error || !map) fail(error ?? 'could not parse the map')

const appDir =
  arg('--app-dir') ??
  (existsSync(join(root, 'app')) ? join(root, 'app') : join(root, 'src', 'app'))
if (!existsSync(appDir)) fail(`no Next.js app directory at ${appDir} (use --app-dir)`)

const report = validateMap(map, scanNextApp(appDir), {
  ignore: [arg('--hud-route') ?? '/vibehud'],
})
const env = buildEnvReport(
  map.env,
  scanEnvExample(root),
  (name) => process.env[name] !== undefined && process.env[name] !== '',
)

if (json) {
  console.log(JSON.stringify({ ok: report.ok, report, env, warnings }, null, 2))
  process.exit(report.ok ? 0 : 1)
}

const B = '\x1b[1m', R = '\x1b[0m', RED = '\x1b[31m', GRN = '\x1b[32m', YEL = '\x1b[33m', DIM = '\x1b[2m'
const line = (label: string, items: string[], color: string) => {
  if (items.length > 0) console.log(`  ${color}${label}${R} ${items.join(', ')}`)
}

console.log(
  report.ok
    ? `${GRN}${B}✓ map verified${R} — pages ${report.declaredCount}/${report.foundCount} · APIs ${report.apiDeclaredCount}/${report.apiFoundCount}`
    : `${YEL}${B}⚠ map drift${R} — pages ${report.declaredCount} declared · ${report.foundCount} on disk — APIs ${report.apiDeclaredCount} declared · ${report.apiFoundCount} on disk`,
)
line('pages missing on disk:', report.missing, RED)
line('pages not declared:   ', report.undeclared, YEL)
line('APIs missing on disk: ', report.apiMissing, RED)
line('APIs not declared:    ', report.apiUndeclared, YEL)
for (const m of report.methodMismatches) {
  console.log(`  ${RED}method drift:${R} ${m.path} declares [${m.declared.join(', ')}] but exports [${m.found.join(', ')}]`)
}
line('dangling refs:        ', report.dangling, RED)
for (const v of env.vars) {
  if (!v.set) console.log(`  ${DIM}env: ${v.name} not set in this shell (informational)${R}`)
  else if (!v.inExample) console.log(`  ${DIM}env: ${v.name} missing from .env.example${R}`)
}
for (const w of warnings) console.log(`  ${DIM}schema: ${w}${R}`)

process.exit(report.ok ? 0 : 1)
