# Blogfolio — agent map

Maintained by the coding agent. Humans: open `/agent-hud` in dev to see this
rendered. Machine-readable state is the block below; format spec lives in the
`agent-hud` package (`spec/FORMAT.md`).

```yaml agent-map
version: 1
app: "Blogfolio"

pages:
  - id: home
    label: Home
    path: /
    status: done
  - id: about
    label: About
    path: /about
    status: done
  - id: blog
    label: Blog
    path: /blog
    status: done
    elements:
      - name: PostList
        kind: list
        status: done
      - name: SubscribeBox
        kind: form
        status: doing
  - id: post
    label: Blog post
    path: /blog/[slug]
    status: doing
    elements:
      - name: MarkdownBody
        kind: component
        status: doing
  - id: contact
    label: Contact
    path: /contact
    status: done

apis:
  - id: subscribe-api
    label: Subscribe API
    path: /api/subscribe
    methods: [POST]

relations:
  - from: blog
    to: subscribe-api
    type: data
  - from: home
    to: about
  - from: home
    to: blog
  - from: home
    to: contact
  - from: blog
    to: post

tasks:
  - id: t1
    title: "Render markdown in posts"
    status: doing
    page: post
  - id: t2
    title: "Add RSS feed"
    status: todo
    page: blog
  - id: t3
    title: "Contact form -> email"
    status: todo
    page: contact
  - id: t4
    title: "Ship landing page copy"
    status: done
    page: home
```
