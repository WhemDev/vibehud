# vibehud (monorepo) — agent map

Maintained by the coding agent. Humans: run `npm run dev` and open
http://localhost:3100/vibehud.

This repo is the vibehud project itself, dogfooding its own HUD. The root
Next.js app exists only to host the panel (`/vibehud` is excluded from
validation), so `pages`/`apis` are empty on purpose — the project's real
moving parts live in `systems`. The examples carry their own maps.

```yaml agent-map
version: 1
app: "vibehud (monorepo)"

pages: []   # the root app hosts only /vibehud; the site is static HTML on Vercel

systems:
  - id: package
    label: "vibehud (npm package)"
    kind: library
    status: done
    note: "packages/vibehud — parser, Next app-dir scanner, validator, brutalist panel, format spec, AGENTS.md template. v0.1.0."
  - id: site
    label: "Marketing site"
    kind: static-site
    status: done
    note: "site/index.html — one-pager, brutalist, animated. Hero shows the copy-paste agent prompt."
  - id: catalog
    label: "UI style catalog"
    kind: static-site
    status: done
    note: "catalog/index.html — 8 style directions; brutalist was chosen and applied to the panel."
  - id: blogfolio
    label: "Example: blogfolio"
    kind: example-app
    status: done
    note: "Clean example — map matches routes, green badge."
  - id: shoply
    label: "Example: shoply"
    kind: example-app
    status: done
    note: "Deliberately drifted example — shows the validation badge. The screenshot app."
  - id: demo-recorder
    label: "Demo recorder"
    kind: tooling
    status: done
    note: "demo/record.mjs — Playwright script driving shoply on :3102. Output in demo/out/ (gitignored)."
  - id: npm-registry
    label: "npm registry"
    kind: distribution
    status: done
    note: "Published as `vibehud` (agent-hud was blocked as too similar to an existing package)."
  - id: vercel
    label: Vercel
    kind: hosting
    status: done
    note: "Serves the site at vibehud-one.vercel.app."
  - id: github
    label: GitHub
    kind: hosting
    status: done
    note: "WhemDev/vibehud — public. Site nav has a live star tracker."

env:
  - name: VIBEHUD_ENABLE
    note: "Set to 1 to allow the panel in production builds; unset = dev-only."

relations:
  - from: package
    to: npm-registry
    type: data
  - from: site
    to: vercel
    type: data
  - from: site
    to: github
    type: nav
  - from: catalog
    to: site
    type: nav
  - from: blogfolio
    to: package
    type: data
  - from: shoply
    to: package
    type: data
  - from: demo-recorder
    to: shoply
    type: data

tasks:
  - id: core
    title: "Core: parser, scanner, validator, panel"
    status: done
  - id: theme
    title: "Pick UI style from catalog + apply (brutalist)"
    status: done
  - id: examples
    title: "Example apps: blogfolio (clean) + shoply (drifted)"
    status: done
  - id: publish
    title: "Publish vibehud 0.1.0 to npm"
    status: done
  - id: ship-site
    title: "Marketing site live on Vercel"
    status: done
  - id: dogfood
    title: "Dogfood: HUD on the monorepo root at /vibehud"
    status: done
  - id: dagre-layout
    title: "Replace BFS map layout with dagre (layered graph, multi-parent + cycles)"
    status: done
  - id: dogfood-fixes
    title: "Dogfood round 2: self-route fix, method drift, dangling-id lint, quiet pings, spec fix"
    status: done
  - id: cli
    title: "npx vibehud check CLI (exit codes + --json)"
    status: done
  - id: redemo
    title: "Re-record demo under the vibehud name (current mp4 is pre-rebrand)"
    status: todo
  - id: launch
    title: "Launch post with demo video + drift-badge screenshot"
    status: todo
```
