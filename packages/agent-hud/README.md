# agent-hud

A render layer for AI-agent state. Your coding agent maintains a small YAML
block in `agent-map.md` (pages, relations, tasks); agent-hud renders it as a
live **map + kanban** at `/agent-hud` and **validates** the declared pages
against your real Next.js routes — so the map cannot silently lie.

- Not a code visualizer, not a diagram generator. It shows what the agent
  *declares*, and the validation badge is what makes that trustworthy:
  `agent declares 5 pages · 7 exist on disk · 1 missing · 2 undeclared`.

## Install (agents do this — see templates/AGENTS.md)

```bash
npm install agent-hud
```

```js
// next.config.mjs
export default { transpilePackages: ['agent-hud'] }
```

```tsx
// app/agent-hud/page.tsx
import { AgentHudPage } from 'agent-hud/next'
export const dynamic = 'force-dynamic'
export default function Page() {
  return <AgentHudPage />
}
```

Then create `agent-map.md` at the repo root — format in
[spec/FORMAT.md](spec/FORMAT.md) — and copy
[templates/AGENTS.md](templates/AGENTS.md) into your project so the agent keeps
the map updated every session.

## API

```ts
import { parseAgentMap, scanNextAppRoutes, validateMap } from 'agent-hud'
import { AgentHudPanel } from 'agent-hud/panel'   // client component
import { AgentHudPage } from 'agent-hud/next'     // server component
```

- `parseAgentMap(markdown)` → `{ map?, warnings, error? }`
- `scanNextAppRoutes(appDir)` → `string[]` of routes (`/`, `/blog/[slug]`, …)
- `validateMap(map, routes)` → `{ ok, matched, missing, undeclared, … }`

Dev-only by default: the page renders nothing in production unless
`AGENT_HUD_ENABLE=1`.

## Status

v1 / weekend build. Next.js app directory only. The panel ships with a
brutalist theme (hard borders, offset shadows, process-yellow alerts); tokens
live in `src/panel/theme.ts`.
