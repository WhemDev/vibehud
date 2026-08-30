# Vibehud — instructions for coding agents

This project uses **vibehud**: you (the agent) maintain `agent-map.md` at the
project root, and the app renders it live at `/vibehud` (dev only). The panel
validates your map against the real routes, so keep it truthful.

**Monorepo note:** this repo IS the vibehud project, dogfooding itself. The
root Next.js app (`app/`) exists only to host the panel — run `npm run dev`
and open http://localhost:3100/vibehud. The root `agent-map.md` describes the
project via `systems` and `tasks` (its `pages` are empty on purpose; the site
is static HTML, not Next routes). `examples/blogfolio` and `examples/shoply`
have their own maps — keep those in sync when you touch an example, and keep
shoply's drift deliberate (it demos the validation badge; don't "fix" it).

## When to update agent-map.md

Update the file **in the same turn** as the change it describes, whenever you:

1. Create, rename, or delete a page/route → update `pages` (and `relations`).
2. Create, rename, or delete an API route handler → update `apis` (path and
   methods).
3. Add or change a page's major building blocks (a form, a grid, a chart) →
   update that page's `elements`.
4. Integrate an external service or database → update `systems`.
5. Start reading a new environment variable → add its NAME to `env` (never a
   value) and to `.env.example`.
6. Start, finish, or plan a piece of work → update `tasks` (todo/doing/done).
7. Are asked about progress → update the file first, then point the user to
   `/vibehud`.

If the panel shows "map drift" (missing or undeclared routes), fixing
`agent-map.md` is part of finishing your task.

## File format

`agent-map.md` is markdown; the machine-readable part is one fenced block
tagged `yaml agent-map`. Full spec: `packages/vibehud/spec/FORMAT.md`.

Field rules:

- `pages[]`: `id` (unique slug) and `path` required. `path` is the route as the
  router sees it, dynamic segments literal (`/blog/[slug]`). `status` is
  `todo` | `doing` | `done` (default `done`). Optional `elements` list what the
  page is made of (`name` required, optional `kind` and `status`) and an
  optional `note` shows in the detail panel.
- `apis[]`: `id` and `path` required; `methods` (default `[GET]`) should match
  the handler's exports; declared paths are validated against real `route.ts`
  handlers, so keep them truthful.
- `systems[]`: external services and databases (`id` required, optional `kind`,
  `status`, `note`). Declaration-only — no filesystem check.
- `env[]`: names of environment variables the app needs — either a bare string
  or `{ name, note }`. NEVER put values here; the HUD checks names against
  `.env.example` and whether each is set.
- `relations[]`: `from`/`to` are page, api, or system ids; `type` is `nav` |
  `data` | `auth` | `other` (default `nav`).
- `tasks[]`: `id` and `title` required; `status` required
  (`todo` | `doing` | `done`); optional `page` links a task to a page id.
- Do not invent other keys; they are ignored with a warning.

The panel is disabled in production builds unless `VIBEHUD_ENABLE=1` is set.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
