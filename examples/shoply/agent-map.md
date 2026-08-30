# Shoply — agent map

This example is **deliberately out of sync** with the filesystem to show the
validation badge: `wishlist` is declared but doesn't exist, while `/account`
and `/orders` exist but aren't declared.

```yaml agent-map
version: 1
app: "Shoply"

pages:
  - id: home
    label: Home
    path: /
    status: done
  - id: products
    label: Products
    path: /products
    status: done
  - id: product
    label: Product detail
    path: /products/[id]
    status: done
  - id: cart
    label: Cart
    path: /cart
    status: doing
  - id: checkout
    label: Checkout
    path: /checkout
    status: doing
  - id: wishlist
    label: Wishlist
    path: /wishlist
    status: todo

relations:
  - from: home
    to: products
  - from: products
    to: product
  - from: product
    to: cart
    type: data
  - from: cart
    to: checkout
  - from: checkout
    to: home
    type: auth

tasks:
  - id: t1
    title: "Hook checkout up to Stripe test mode"
    status: doing
    page: checkout
  - id: t2
    title: "Build wishlist page"
    status: todo
    page: wishlist
  - id: t3
    title: "Cart quantity controls"
    status: doing
    page: cart
  - id: t4
    title: "Product grid with images"
    status: done
    page: products
  - id: t5
    title: "Seed 20 demo products"
    status: done
```
