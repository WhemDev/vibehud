# Shoply — agent map

This example is **deliberately out of sync** with the filesystem to show the
validation badge: the `wishlist` page and `wishlist-api` are declared but don't
exist, while `/account`, `/orders`, and `/api/orders` exist but aren't declared.

```yaml agent-map
version: 1
app: "Shoply"

pages:
  - id: home
    label: Home
    path: /
    status: done
    elements:
      - name: HeroBanner
        kind: component
      - name: FeaturedProducts
        kind: list
  - id: products
    label: Products
    path: /products
    status: done
    elements:
      - name: ProductGrid
        kind: list
        status: done
      - name: FilterBar
        kind: component
        status: doing
      - name: Pagination
        kind: component
        status: todo
  - id: product
    label: Product detail
    path: /products/[id]
    status: done
    elements:
      - name: ImageGallery
        kind: component
      - name: AddToCartButton
        kind: component
  - id: cart
    label: Cart
    path: /cart
    status: doing
    elements:
      - name: CartTable
        kind: list
        status: done
      - name: QuantityStepper
        kind: component
        status: doing
  - id: checkout
    label: Checkout
    path: /checkout
    status: doing
    note: "Stripe is in test mode until the domain is verified."
    elements:
      - name: AddressForm
        kind: form
        status: done
      - name: PaymentForm
        kind: form
        status: doing
  - id: wishlist
    label: Wishlist
    path: /wishlist
    status: todo

apis:
  - id: products-api
    label: Products API
    path: /api/products
    methods: [GET]
  - id: checkout-api
    label: Checkout API
    path: /api/checkout
    methods: [POST]
    note: "Creates the Stripe payment intent."
  - id: wishlist-api
    label: Wishlist API
    path: /api/wishlist
    methods: [GET, POST]
    status: todo

systems:
  - id: stripe
    label: Stripe
    kind: payments
    status: doing
    note: "Test mode only until the domain is verified."
  - id: db
    label: Postgres
    kind: database
    status: done

flows:
  - id: checkout-flow
    label: "Checkout pipeline"
    status: doing
    note: "Order path from cart to confirmation email."
    steps:
      - label: "Validate cart"
        uses: cart
        status: done
      - label: "Create payment intent"
        uses: checkout-api
        status: done
      - label: "Stripe webhook"
        uses: stripe
        status: doing
        note: "Signature verification not wired yet."
      - label: "Write order row"
        uses: db
        status: doing
      - label: "Confirmation email"
        status: todo
  - id: catalog-sync
    label: "Catalog sync"
    status: done
    steps:
      - label: "Nightly import job"
      - label: "Normalize products"
      - label: "Upsert catalog"
        uses: db

env:
  - name: DATABASE_URL
  - name: STRIPE_SECRET_KEY
    note: "Stripe test-mode secret"
  - name: NODE_ENV

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
  - from: products
    to: products-api
    type: data
  - from: checkout
    to: checkout-api
    type: data
  - from: wishlist
    to: wishlist-api
    type: data
  - from: checkout-api
    to: stripe
    type: data
  - from: products-api
    to: db
    type: data
  - from: checkout-api
    to: db
    type: data

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
