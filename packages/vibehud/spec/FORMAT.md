# agent-map format v1

One file, `agent-map.md`, at the project root. Markdown prose is for humans;
one fenced code block tagged `yaml agent-map` is for machines. Renderers use
the first block tagged `agent-map` (falling back to the first `yaml`/`yml`
block).

````markdown
# My App — agent map

Maintained by the coding agent. Humans: read the panel at /vibehud.

```yaml agent-map
version: 1                # required, currently always 1
app: "My App"             # optional display name

pages:                    # the screens/routes of the app
  - id: home              # required, unique slug
    label: "Home"         # optional, defaults to id
    path: /               # required — the route as the router sees it,
                          # dynamic segments literal: /blog/[slug]
    status: done          # todo | doing | done (default done)
    note: "free text"     # optional, shown in the detail panel
    elements:             # optional — what the page is made of
      - HeroBanner        # string shorthand, or:
      - name: PaymentForm # required
        kind: form        # optional free text (component, form, list, ...)
        status: doing     # optional todo | doing | done

apis:                     # optional — the app's API route handlers
  - id: products-api      # required, unique (shared id space with pages)
    label: "Products API" # optional, defaults to id
    path: /api/products   # required, validated against real route handlers
    methods: [GET, POST]  # optional, defaults to [GET]
    status: done          # todo | doing | done (default done)
    note: "free text"     # optional

systems:                  # optional — external services, declaration-only
  - id: stripe            # required, unique (shared id space)
    label: Stripe         # optional, defaults to id
    kind: payments        # optional free text (db, auth, storage, ...)
    status: doing         # todo | doing | done (default done)
    note: "free text"     # optional

env:                      # optional — env var NAMES the app needs (never values)
  - DATABASE_URL          # string shorthand, or:
  - name: STRIPE_SECRET_KEY
    note: "test-mode key" # optional

relations:                # optional edges between pages, apis, and systems
  - from: home            # any declared id
    to: blog
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
- `pages[].path` and `apis[].path` are compared against the real filesystem
  routes and route handlers by the validator; missing and undeclared entries
  are surfaced in the UI. This is the contract that keeps the map honest.
- `elements` are declarative (not verified against code): use them to show
  what a page is made of in the detail panel.
- `env` names are checked against `.env.example` and against which variables
  are actually set in the running process. Only names travel — values never
  appear anywhere.
- `systems` are declaration-only (no filesystem validation); the renderer may
  ping declared `apis` for liveness in dev.
- Dynamic route segments are written and matched literally (`[slug]`,
  `[...parts]`, `[[...opt]]`).
- IDs are stable handles for relations and tasks; renaming a page's `id` means
  updating every reference to it.

## Design notes

Inspired by [JSON Canvas](https://jsoncanvas.org/): a small open format any
tool can render. v1 deliberately excludes a `systems` layer (databases,
external APIs) — add pages and tasks only.
