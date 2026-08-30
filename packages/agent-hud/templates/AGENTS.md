# Agent HUD — instructions for coding agents

This project uses **agent-hud**: you (the agent) maintain `agent-map.md` at the
project root, and the app renders it live at `/agent-hud` (dev only). The panel
validates your map against the real routes, so keep it truthful.

## When to update agent-map.md

Update the file **in the same turn** as the change it describes, whenever you:

1. Create, rename, or delete a page/route → update `pages` (and `relations`).
2. Create, rename, or delete an API route handler → update `apis` (path and
   methods).
3. Add or change a page's major building blocks (a form, a grid, a chart) →
   update that page's `elements`.
4. Start, finish, or plan a piece of work → update `tasks` (todo/doing/done).
5. Are asked about progress → update the file first, then point the user to
   `/agent-hud`.

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
- `relations[]`: `from`/`to` are page or api ids; `type` is `nav` | `data` |
  `auth` | `other` (default `nav`).
- `tasks[]`: `id` and `title` required; `status` required
  (`todo` | `doing` | `done`); optional `page` links a task to a page id.
- Do not invent other keys; they are ignored with a warning.

## One-time setup (if not installed yet)

1. `npm install agent-hud`
2. Add `transpilePackages: ['agent-hud']` to `next.config`.
3. Create `app/agent-hud/page.tsx`:

```tsx
import { AgentHudPage } from 'agent-hud/next'

export const dynamic = 'force-dynamic'

export default function Page() {
  return <AgentHudPage />
}
```

4. Create `agent-map.md` at the project root describing the current app.
5. Copy this file's "When to update" rules into the project's agent
   instruction file (AGENTS.md / CLAUDE.md / .cursor/rules) so future sessions
   keep the map fresh.

The panel is disabled in production builds unless `AGENT_HUD_ENABLE=1` is set.
