// Records the agent-hud demo: an "agent session" edits agent-map.md and the
// filesystem while the panel live-updates. Run from the repo root with the
// shoply dev server already up on :3102. Output: demo/out/*.webm
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname
const SHOPLY = ROOT + 'examples/shoply/'
const MAP = SHOPLY + 'agent-map.md'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const setMap = (mutate) => writeFileSync(MAP, mutate(readFileSync(MAP, 'utf8')))

mkdirSync(ROOT + 'demo/out', { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 860 },
  recordVideo: { dir: ROOT + 'demo/out', size: { width: 1440, height: 860 } },
})
const page = await context.newPage()
await page.goto('http://localhost:3102/agent-hud')
await page.waitForSelector('text=map drift')
console.log('recording: opening state (drift)')
await sleep(3500)

// Step 1: the "agent" declares the two undeclared routes.
console.log('step 1: declare /account and /orders')
setMap((s) =>
  s.replace(
    'relations:',
    `  - id: account
    label: Account
    path: /account
    status: done
  - id: orders
    label: Orders
    path: /orders
    status: done

relations:`,
  ),
)
await page.waitForSelector('text=1 missing', { timeout: 10000 })
await sleep(3500)

// Step 2: the "agent" builds the missing wishlist page -> badge flips green.
console.log('step 2: create the wishlist page')
mkdirSync(SHOPLY + 'app/wishlist', { recursive: true })
writeFileSync(
  SHOPLY + 'app/wishlist/page.tsx',
  "export default function Page() {\n  return <main style={{ padding: 40, fontFamily: 'system-ui' }}><h1>Wishlist</h1></main>\n}\n",
)
setMap((s) =>
  s
    .replace('    path: /wishlist\n    status: todo', '    path: /wishlist\n    status: doing')
    .replace(
      '    title: "Build wishlist page"\n    status: todo',
      '    title: "Build wishlist page"\n    status: doing',
    ),
)
await page.waitForSelector('text=map verified', { timeout: 15000 })
console.log('badge flipped to verified')
await sleep(3500)

// Step 3: work wraps up on the kanban.
console.log('step 3: finish tasks')
setMap((s) =>
  s
    .replace(
      '    title: "Build wishlist page"\n    status: doing',
      '    title: "Build wishlist page"\n    status: done',
    )
    .replace('    path: /wishlist\n    status: doing', '    path: /wishlist\n    status: done')
    .replace(
      'tasks:',
      `tasks:
  - id: t6
    title: "Order history table"
    status: todo
    page: orders`,
    ),
)
await page.waitForSelector('text=Order history table', { timeout: 10000 })
await sleep(4000)

await context.close()
await browser.close()
console.log('done — video in demo/out/')
