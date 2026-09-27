# Design previews and orders

The mobile builder captures its jewelry canvas as an 840 × 840 PNG when a customer saves a design. It sends that image in the `designPreview` field of the authenticated multipart `POST /products` request, with `items` encoded as JSON text. The backend returns the Product's `designPreviewUrl`; the app shows it in saved designs, order review, confirmation, the orders list, and order detail. A failed capture or save leaves the builder editable and allows retry. Editing a saved design creates a new Product because customer `PATCH /products/{id}` is not permitted.

Native uploads use an `expo-file-system` File with `expo/fetch`. SDK 57's multipart encoder rejects legacy React Native `{ uri, name, type }` parts before sending the request, so adding `file://` alone does not fix that incompatibility. Run `node --test scripts/commerce-upload.test.cjs` to verify the upload parts against the installed Expo encoder. This module is included in Expo Go; custom development builds need rebuilding when adding it.

The app uses the backend's saved Product price for review and the Order's `totalPrice` for confirmation and history. Stock changes only after a successful `POST /orders`. An order failure keeps the design editable. Since `POST /orders` has no idempotency key, the app does not automatically retry an uncertain submission.

## Backend gaps for permanent historical accuracy

The current Order response includes the related Product and its `designPreviewUrl`, but no order-level preview snapshot or component snapshot. An administrator can still replace the Product preview after an order is placed; component names also come from current SubCategories. The mobile app therefore cannot guarantee that an old order's preview and component labels remain unchanged. For immutable history, the backend should copy the preview asset reference and component names, quantities, positions, and unit prices into order-owned snapshot fields in the order transaction, expose those fields in `GET /orders` and `GET /orders/{id}`, and retain snapshot assets. The app should then render those snapshot fields for order screens.

ProductItems persist `position` but not the canvas angle. Reopening a saved Product reconstructs the component sequence, while the exact free-form layout remains visible only in its saved preview. To restore editable placement precisely across sessions, the backend would also need to store layout coordinates/angles on the Product or a design-layout field.

On web, remote component images need image CORS headers for canvas capture. The local browser tests serve image fixtures with `Access-Control-Allow-Origin: *`. Native capture does not use browser canvas CORS.
