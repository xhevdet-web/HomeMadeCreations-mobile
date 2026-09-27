# Catalog, saved designs and Cash on Delivery orders

Flow: Create your own -> Categories -> Designer -> Preview / Save design ->
Review order -> Place Order -> Confirmation / My Orders.

The API root comes from EXPO_PUBLIC_API_URL in .env, including /api/v1.
The current local address is http://192.168.1.5:3000/api/v1. Update it when the
computer's LAN address changes and fully reload the app.

Categories and components use public GET endpoints. Active entries are sorted by
sortOrder. Choose your details keeps the existing bundled artwork and displays
color, unit price and stock. The original canvas supports adding, removing,
replacing and repositioning beads; Preview adds per-component quantity controls.
The existing studio limit is 32 beads. Estimates use integer cents.

Save design sends POST /products with categoryId, name, optional description and
items (subCategoryId, quantity, position). Consecutive matching beads are grouped;
repeated beads at different positions remain separate entries. No customer ID,
price, itemCount, unitPrice or imageUrl is sent. An unchanged saved draft is reused;
changing it creates a new Product. Customers never edit/delete backend products.
Saved totals and unit prices come from the server. Saving does not reserve stock.

My Designs reads GET /users/{userId}/products. Opening a design for editing or
checkout reads GET /products/{id}. Editing a saved design creates a copy on save.
API metadata is cached to restore the canvas after an app restart.

Profile saves the signed-in customer's own details using PATCH /users/me. Review your order displays only the saved design, quantities, price, Cash on Delivery and optional notes. It does not read or update profile fields. If the backend requires missing delivery details, checkout links to Profile and offers a return to the order. The backend requires firstName, lastName, phone, country and address; postalCode is optional.
POST /orders sends only productId, paymentType=CASH_ON_DELIVERY and optional
customerNotes, with the authenticated bearer token from the existing token storage.
No local delivery fee or demo order is added. Backend stock errors are shown
verbatim and trigger a component refresh. Success refreshes components and orders.

Place Order is disabled during submission. A persistent, account/product-scoped
submission flag prevents resending a successful or uncertain request, including
after navigation/restart. Network errors, timeouts and server errors are treated
as uncertain: the customer is directed to My Orders and there is no automatic
POST retry. Confirm a missing order with the backend before resolving such a flag.

Confirmation retains the returned order and refreshes GET /orders/{id}. My Orders
uses GET /orders with data/meta pagination and refreshes on focus or request.
Tracking displays ORDERED -> CREATING -> CREATED -> READY_FOR_COURIER ->
PICKED_UP_BY_COURIER -> COMPLETED. Customers cannot modify statuses.
Only Cash on Delivery can be selected. No card processing is included.

Checks:
- npm.cmd run lint
- npm.cmd run typecheck
- npm.cmd run test:auth
- npx.cmd expo export --platform web
- npx.cmd playwright test tests/catalog.spec.ts tests/commerce.spec.ts

Browser tests mock the API; they do not create real backend products or orders.