# Vibehud — instructions for coding agents

This project uses **vibehud**: you (the agent) maintain `agent-map.md` at the
project root, and the app renders it live at `/vibehud` (dev only). The panel
validates your map against the real routes, so keep it truthful.

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
tagged `yaml agent-map`:

```yaml agent-map
version: 1
app: "My App"
pages:
  - id: home
    label: Home
    path: /
    status: done
  - id: blog
    label: Blog
    path: /blog
    status: doing
    elements:
      - name: PostList
        kind: list
        status: done
      - name: SubscribeBox
        kind: form
        status: doing
apis:
  - id: subscribe-api
    label: Subscribe API
    path: /api/subscribe
    methods: [POST]
relations:
  - from: home
    to: blog
    type: nav
  - from: blog
    to: subscribe-api
    type: data
tasks:
  - id: t1
    title: "Write first post"
    status: todo
    page: blog
```

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

## One-time setup (if not installed yet)

1. `npm install vibehud`
2. Add `transpilePackages: ['vibehud']` to `next.config`.
3. Create `app/vibehud/page.tsx`:

```tsx
import { VibehudPage } from 'vibehud/next'

export const dynamic = 'force-dynamic'

export default function Page() {
  return <VibehudPage />
}
```

4. Create `agent-map.md` at the project root describing the current app.
5. Copy this file's "When to update" rules into the project's agent
   instruction file (AGENTS.md / CLAUDE.md / .cursor/rules) so future sessions
   keep the map fresh.

The panel is disabled in production builds unless `VIBEHUD_ENABLE=1` is set.
