# Agent HUD — v1 Design

Date: 2026-08-30. Source context: [agent-map-handoff.md](../../../agent-map-handoff.md).
Built overnight per user instruction; open questions settled with defaults below — all reversible.

## Concept (unchanged from handoff)

An open source render layer for AI-agent state. The agent maintains a fenced YAML
block inside `agent-map.md` describing the app (pages, relations, tasks). A drop-in
React panel renders it as a map + kanban, and a validator compares declared pages
against the real Next.js app-directory routes so the map cannot silently lie.

## Decisions on the five open questions

1. **Schema & file location** — `agent-map.md` at repo root (user-confirmed),
   markdown prose + one fenced ` ```yaml agent-map ` block. Schema below.
2. **Mounting** — dev-only route inside the user's app (user-confirmed).
   The agent creates `app/agent-hud/page.tsx`, a **server component** that reads
   the file, runs the scanner, and renders the client panel. (Originally planned
   as `app/_map`, but Next.js excludes `_`-prefixed folders from routing.)
   Renders nothing when `NODE_ENV === 'production'` unless `AGENT_HUD_ENABLE=1`.
3. **Layout** — v1 is deliberately plain: validation badge on top, map (SVG,
   hand-rolled layered layout) above, kanban (3 columns) below, in one scrolling
   page. Visual style intentionally minimal — production style will be chosen
   from the UI style catalog (separate deliverable).
4. **Scanner invocation** — on panel load (server component render). A page
   refresh re-scans; no watchers in v1. The agent instruction file tells the
   agent to update `agent-map.md` after changes, so freshness is refresh-driven.
5. **Package name** — `agent-hud` (verified free on npm 2026-08-30; `agentmap`,
   `agent-map`, `agent-atlas`, `agent-canvas` are taken).

## YAML schema (v1)

```yaml
version: 1                # required, integer
app: "My App"             # optional display name
pages:                    # required list
  - id: home              # required, unique slug
    label: "Home"         # optional, defaults to id
    path: /               # required, route path as the router sees it
    status: done          # todo | doing | done (default: done)
relations:                # optional list
  - from: home            # page id
    to: blog              # page id
    type: nav             # nav | data | auth | other (default: nav)
tasks:                    # optional list
  - id: t1                # required, unique
    title: "Wire up auth" # required
    status: doing         # todo | doing | done (required)
    page: login           # optional page id link
```

`systems` is explicitly out of v1 (per handoff). Unknown keys are ignored with a
warning, never a crash — agents will emit variants.

## Package layout (`packages/agent-hud`)

Shipped as TypeScript/TSX source (`src/`), consumers use Next.js
`transpilePackages: ['agent-hud']`. Zero runtime deps except `yaml`.

- `src/schema.ts` — types + `normalizeMap()` (lenient validation, collects warnings)
- `src/parser.ts` — `parseAgentMap(markdown)` → `{ map, warnings }` (extracts the
  fenced yaml block; tolerant of ```yml, info strings, missing block)
- `src/scanner.ts` — `scanNextAppRoutes(appDir)` → route paths. Handles
  `page.{tsx,ts,jsx,js}`, route groups `(group)`, dynamic `[slug]`, catch-all
  `[...x]`, `[[...x]]`, ignores private `_folders`, `@slots`, and non-page files.
- `src/validate.ts` — `validateMap(map, routes)` → `{ matched, undeclared,
  missing }` where dynamic segments match declared paths (`/blog/[slug]` matches
  a declared `/blog/[slug]` literally; no param inference in v1).
- `src/panel/*` — client components: `AgentHudPanel`, `MapView` (SVG, BFS layers
  from the `/` page, straight edges), `KanbanView`, `ValidationBadge`.
- `src/next.tsx` — `renderAgentHudPage(opts)` helper the generated
  `app/_map/page.tsx` calls: prod gate, read file, parse, scan, render panel.
- `templates/AGENTS.md` — the agent instruction file (first-class deliverable):
  when to update `agent-map.md`, exact schema, install steps.
- `spec/FORMAT.md` — the one-page format spec.
- Tests: vitest for parser, scanner (fixture dirs), validator.

## Examples (two, different on purpose)

1. `examples/blogfolio` — small portfolio/blog, map matches reality → green badge.
2. `examples/shoply` — small shop with deliberate drift: one declared page that
   doesn't exist, two real routes not declared → the badge shows
   "declared 5 · found 6 · 1 missing · 2 undeclared". This is the screenshot.

Both are minimal hand-written Next.js apps (no create-next-app), `agent-hud` via
`file:` dependency, panel at `/_map`.

## UI style catalog (separate deliverable)

One static HTML page showing the same sample elements — mini map (nodes+edges),
two kanban cards, validation badge, status pills — in ~8 distinct style
directions (e.g. terminal mono, blueprint, Linear-dark, Notion-minimal,
neo-brutalist, soft glass, sketch, warm paper). User picks one for production;
the chosen style then gets implemented as the panel's real CSS in a follow-up
session. Published as an artifact + kept in `catalog/`.

## Error handling

- Missing/unparseable `agent-map.md` → panel renders a friendly setup screen
  with the file template, never a crash.
- Bad YAML → show the YAML error + line, keep last-known-good out of scope for v1.
- Scanner on a non-Next project → validation badge shows "no app directory
  found", map/kanban still render from the file.

## Out of scope (v1)

Systems layer, multiple frameworks, CLI, hosted service, file watchers,
map editing from the UI, styling beyond the plain default.
