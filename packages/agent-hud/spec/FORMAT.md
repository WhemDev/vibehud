# agent-map format v1

One file, `agent-map.md`, at the project root. Markdown prose is for humans;
one fenced code block tagged `yaml agent-map` is for machines. Renderers use
the first block tagged `agent-map` (falling back to the first `yaml`/`yml`
block).

````markdown
# My App — agent map

Maintained by the coding agent. Humans: read the panel at /agent-hud.

```yaml agent-map
version: 1                # required, currently always 1
app: "My App"             # optional display name

pages:                    # the screens/routes of the app
  - id: home              # required, unique slug
    label: "Home"         # optional, defaults to id
    path: /               # required — the route as the router sees it,
                          # dynamic segments literal: /blog/[slug]
    status: done          # todo | doing | done (default done)

relations:                # optional edges between pages
  - from: home            # page id
    to: blog              # page id
    type: nav             # nav | data | auth | other (default nav)

tasks:                    # optional work items, rendered as a kanban
  - id: t1                # required, unique
    title: "Wire up auth" # required
    status: doing         # todo | doing | done
    page: login           # optional page id this task belongs to
```
````

## Rules

- Parsers are lenient: unknown keys and invalid entries are ignored with
  warnings, never a crash.
- `pages[].path` is compared against the real filesystem routes by the
  validator; missing and undeclared routes are surfaced in the UI. This is the
  contract that keeps the map honest.
- Dynamic route segments are written and matched literally (`[slug]`,
  `[...parts]`, `[[...opt]]`).
- IDs are stable handles for relations and tasks; renaming a page's `id` means
  updating every reference to it.

## Design notes

Inspired by [JSON Canvas](https://jsoncanvas.org/): a small open format any
tool can render. v1 deliberately excludes a `systems` layer (databases,
external APIs) — add pages and tasks only.
