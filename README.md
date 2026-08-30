# agent-hud

**Your agent says it built it. This proves it.**

An open source render layer for AI-agent state. Your coding agent maintains a
small YAML block in `agent-map.md` (pages, APIs, systems, env, tasks);
agent-hud renders it as a live **map + kanban** at `/agent-hud` and
**validates** the declarations against your real Next.js routes — so the map
cannot silently lie.

🌐 **Site:** https://agent-hud-five.vercel.app · 📦 **npm:** [`agent-hud`](https://www.npmjs.com/package/agent-hud)

## Quick start

Paste this to your agent (Cursor, Claude Code, Lovable, Bolt, Replit…):

> Set up agent-hud in this project, then keep it updated.
> 1. `npm install agent-hud`
> 2. Add `transpilePackages: ['agent-hud']` to next.config.
> 3. Create `app/agent-hud/page.tsx` rendering `AgentHudPage` from `agent-hud/next` with `dynamic = 'force-dynamic'`.
> 4. Create `agent-map.md` at the repo root describing THIS app (spec: `node_modules/agent-hud/spec/FORMAT.md`).
> 5. Copy `node_modules/agent-hud/templates/AGENTS.md` into my agent instructions so every future session keeps the map updated.

Manual setup, the format spec, and the agent instruction template live in
[packages/agent-hud](packages/agent-hud).

## What the panel shows

- **Drift badge** — declared pages/APIs vs. what actually exists on disk, with
  a one-click "copy fix prompt" to hand the reconciliation back to your agent
- **Map** — pages (BFS-layered), API routes with methods, declaration-only
  systems band; click any node for a detail drawer (elements, connections,
  tasks, notes)
- **Live health** — each declared API pinged in dev (responding / 5xx / 404)
- **Env check** — declared env NAMES vs. `.env.example` vs. what's set
  (values never appear anywhere)
- **History strip** — git-powered structural diffs of the map, newest first
- **Kanban + progress** — tasks with page links, filter box, focus dimming
- **Auto-refresh** — the panel re-renders every 2s while the agent works

Dev-only by default; production renders nothing unless `AGENT_HUD_ENABLE=1`.

## Repository layout

- [`packages/agent-hud`](packages/agent-hud) — the npm package (parser,
  scanner, validator, panel, format spec, AGENTS.md template)
- [`examples/blogfolio`](examples/blogfolio) — clean example (green badge)
- [`examples/shoply`](examples/shoply) — deliberately drifted example (the
  screenshot)
- [`site/`](site) — the one-page website
- [`demo/record.mjs`](demo/record.mjs) — scripted demo recording (Playwright)

## Development

```bash
npm install
npm test                      # vitest: parser, scanner, validator, env, history
npm run dev -w shoply         # drifted example on :3102/agent-hud
npm run dev -w blogfolio      # clean example on :3101/agent-hud
```

## Status

Weekend-project energy: Next.js app directory only, one theme (brutalist,
chosen from a style catalog), v0.x APIs may move. Issues and PRs welcome.

MIT © agent-hud contributors. Format inspired by [JSON Canvas](https://jsoncanvas.org/).
