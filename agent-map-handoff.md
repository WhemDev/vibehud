# Agent Map: Weekend Project Handoff

Working name is a placeholder. Rename freely.

## One-line concept

An open source render layer for AI-agent state. The agent maintains a small YAML block inside a markdown file describing the app (pages, relations, progress, todos). A drop-in React panel renders it as a kanban plus map, and a validator checks the declared pages against the real filesystem so the map cannot silently lie.

This is NOT a code visualizer and NOT a diagram generator. It visualizes what the agent declares, and validation is what makes that trustworthy.

## Target user and distribution

- Target: vibe-coding platform users (Lovable, Bolt, Replit, Cursor, Claude Code). The human never runs a CLI.
- The agent does everything: installs the npm package, mounts the panel on a dev-only route, creates and maintains the state file.
- Persistence problem: the agent only keeps the file updated if the instruction lives somewhere it re-reads every session. Ship an AGENTS.md / SKILL.md / Cursor rule file as a first-class deliverable, not an afterthought.
- Trigger example: user says "also show the current progress in X workflows", the agent updates the file, the panel re-renders.

## Three deliverables (all required, or it dies after the demo)

1. Format spec: one page.
2. Renderer: an npm package exporting a React panel.
3. Agent instruction file: AGENTS.md / SKILL.md content telling the agent when and how to update the state file.

## Format decisions

- Do NOT invent a DSL (the `PAGES: "home", "blog"` style). Custom grammar means writing a parser and agents will emit a hundred syntax variants.
- Use a fenced YAML (or JSON) block inside a markdown file. Prose around the block is for humans, the block is for machines.
- Precedent to copy: JSON Canvas (open node/edge format from Obsidian, any app can render it). Our format is a small opinionated superset: nodes, edges, plus a progress/todo schema.
- Suggested top-level keys for v1 (draft, adjust in Claude Code):
  - `pages`: id, label, path, status
  - `relations`: from, to, type (nav, data, auth, etc.)
  - `systems`: optional for v1, skip unless trivial (db, auth, external APIs)
  - `tasks`: id, title, status (todo / doing / done), linked page or system
- Deterministic parsing comes for free from YAML. Spend the determinism budget on validation instead.

## Validation (the differentiator)

- Compare declared pages against actual routes. Next.js app directory first (one framework only at launch).
- Later candidates: React Router, SvelteKit, env vars declared vs `.env.example`, API routes declared vs handlers.
- Output a visible badge in the panel, e.g. "agent declares 5 pages, 7 exist". Undeclared and orphaned items listed.
- This badge is the tweetable screenshot and the reason the dashboard is trustworthy.

## Renderer

- Style decided tentatively: kanban (tasks) plus map (pages and relations). Not Mermaid. The UI quality is the whole difference from existing tools; budget most of the weekend here, not on parsing.
- Must look good in a 20-second screen recording where the map updates live during an agent session.

## Security

- The panel exposes the app's internal map and todo list. Gate to dev mode by default. Never ship to production unless explicitly enabled.

## Scope for v1 (weekend)

In:
- Format spec
- React panel: kanban plus map, reading the YAML block
- Next.js app dir route scanner and validation badge
- AGENTS.md / SKILL.md instruction file
- Demo recording

Out:
- Systems layer, templates, "everything" views
- Multiple frameworks
- CLI for humans
- Any hosted service

## Prior art and competitors (for positioning, not copying)

- GitDiagram: GitHub URL to Mermaid diagram, viral early 2025, thousands of stars. Static snapshot, engineer audience.
- Repomix and "pack repo, ask for diagram" prompts: commoditized.
- CodeSee (shut down), Sourcetrail (archived), dependency-cruiser, madge: deterministic visualizers, looked at once and abandoned.
- Solarch (solarch.dev): draw backend architecture as node/edge graph, default-deny rules engine, NestJS codegen, MCP server. Engineer audience, backend only, too fine-grained for vibe coders.
- JSON Canvas: open format precedent.
- Platform risk: Lovable, Bolt, Replit could ship this natively and erase the project overnight.

## Honest expectations

- A few hundred GitHub stars and a mid-numbers Twitter post are plausible if the demo is visual and the validation badge lands. Not plausible for a generic "visualize your repo" tool.
- Retention for this category is near zero. Treat it as a portfolio and audience piece, not a stepping stone to a startup.
- Confidence: medium. Outcome depends more on the demo video than on the idea.

## Open questions to settle in Claude Code

1. Exact YAML schema and file name/location (e.g. `agent-map.md` at repo root).
2. Whether the panel mounts as a route inside the user's app or as a separate local page served by the package.
3. Kanban plus map layout details: split view, tabs, or overlay.
4. How the scanner is invoked: on panel load, on file change, or by the agent after each session.
5. Package name.
