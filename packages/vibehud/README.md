# vibehud

A render layer for AI-agent state. Your coding agent maintains a small YAML
block in `agent-map.md` (pages, relations, tasks); vibehud renders it as a
live **map + kanban** at `/vibehud` and **validates** the declared pages
against your real Next.js routes — so the map cannot silently lie.

- Not a code visualizer, not a diagram generator. It shows what the agent
  *declares*, and the validation badge is what makes that trustworthy:
  `agent declares 5 pages · 7 exist on disk · 1 missing · 2 undeclared`.

## Install (agents do this — see templates/AGENTS.md)

```bash
npm install vibehud
```

```js
// next.config.mjs
export default { transpilePackages: ['vibehud'] }
```

```tsx
// app/vibehud/page.tsx
import { VibehudPage } from 'vibehud/next'
export const dynamic = 'force-dynamic'
export default function Page() {
  return <VibehudPage />
}
```

Then create `agent-map.md` at the repo root — format in
[spec/FORMAT.md](spec/FORMAT.md) — and copy
[templates/AGENTS.md](templates/AGENTS.md) into your project so the agent keeps
the map updated every session.

## CLI

```bash
npx vibehud check          # exit 0 clean, exit 1 on drift
npx vibehud check --json   # machine-readable, for agents and CI
```

Validates pages, API routes **and their methods**, and referential integrity
(dangling relation/task ids) — the same checks as the panel badge, headless.

## API

```ts
import { parseAgentMap, scanNextAppRoutes, validateMap } from 'vibehud'
import { VibehudPanel } from 'vibehud/panel'   // client component
import { VibehudPage } from 'vibehud/next'     // server component
```

- `parseAgentMap(markdown)` → `{ map?, warnings, error? }`
- `scanNextAppRoutes(appDir)` → `string[]` of routes (`/`, `/blog/[slug]`, …)
- `validateMap(map, routes)` → `{ ok, matched, missing, undeclared, … }`

Dev-only by default: the page renders nothing in production unless
`VIBEHUD_ENABLE=1`.

## Status

v1 / weekend build. Next.js app directory only. The panel ships with a
brutalist theme (hard borders, offset shadows, process-yellow alerts); tokens
live in `src/panel/theme.ts`.
