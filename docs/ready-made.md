# Ready-made purchases

Discover renders ReadyMadeCollection. It filters GET /products to products with isActive === true and productType === READY_MADE. Details and checkout use the existing Product ID, never POST /products or the builder. The existing app requires authentication before Discover. Orders use POST /orders with productId, paymentType: CASH_ON_DELIVERY, and optional customerNotes; delivery comes from the authenticated profile.

## Backend verification needed

The configured API at http://192.168.1.5:3000/api/v1 was unreachable during implementation, so live responses could not be inspected. Existing API adapters and order tests establish the current order request contract, but ready-made fields still need verification against the running backend.

GET /products and GET /products/{id} must return id, name, categoryId, a nonnegative integer price in the existing minor currency units, explicit productType and isActive, and nonnegative integer stock. Missing stock blocks purchasing rather than assuming availability. Return description, designPreviewUrl or imageUrl, and color when available. Color is never inferred from component colors. Confirm the backend supports ready-made Product IDs in POST /orders, atomically checks/decrements finished-product stock, and requires firstName, lastName, phone, country and address from the profile (postalCode is optional under the current contract).

Order responses must include the existing order number, totalPrice, paymentType, status and related product image. Immutable historical images require an order-owned image snapshot; see design-preview-order-flow.md. The client currently renders the saved related Product image supplied by the backend.

Uncertain submissions remain locked in persisted commerce state, including network errors, invalid successful responses, and server errors. There is no automatic POST retry. Definite inventory errors refresh the selected product; unknown stock prevents further submission.
