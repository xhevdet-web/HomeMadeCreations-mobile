# Backend images in the mobile app

The mobile catalog renders the complete `imageUrl` returned by the backend. It does not construct storage URLs, upload images, or use R2 credentials. Existing authentication and order requests remain unchanged.

## Behavior

- Category cards, component cards, product cards, product details, My Designs and saved-product summaries use backend images.
- Discover and the collection load active products from public `GET /products`; product details refresh from `GET /products/{id}`. Both use the existing `EXPO_PUBLIC_API_URL` catalog request helper.
- `CatalogCategory` (and its `CatalogComponent` subtype), `SavedProduct`, `Product`, and `CustomizationItem` support optional nullable `imageUrl` and `imageKey`. Only `imageUrl` is rendered.
- All API image views reuse `CatalogImage`: fixed dimensions, `contain` scaling, transparent background, and a small bundled transparent PNG fallback for missing, invalid or failed URLs. Native React Native Image is reused without a new dependency.
- The picker, new-bead drag ghost, placed beads, selection strip and repositioning ghost display the same component image. Existing circle/necklace coordinates and gestures are preserved; images are positioned over the existing cord.
- A placed item's unique `id` identifies that instance; `itemId` references its SubCategory and the existing persisted catalog registry stores its name, image, price, color and type. Repeated components remain separate visual instances.
- Saving still groups consecutive identical components into ProductItems with `subCategoryId`, `quantity`, and the first position of each run. Images and client prices are not sent. The backend calculates saved totals.
- Existing stock guards prevent adding more copies than available. Adding, removing, moving and saving never deduct stock; order inventory logic is unchanged.
- Backend product price is shown separately from the zero-cost blank design template so starting a new design does not double-charge the reference product's price.
- Static catalog imagery is replaced. Branding, onboarding artwork, studio backgrounds and legacy draft compatibility are retained; these are not backend product images.

## Files changed for this feature

```text
assets/catalog-placeholder.png
src/components/designer/BeadPicker.tsx
src/components/designer/DesignItem.tsx
src/components/designer/JewelryCanvas.tsx
src/components/products/CatalogImage.tsx
src/components/products/CategoryCard.tsx
src/components/products/ProductCard.tsx
src/components/products/SavedProductSummary.tsx
src/screen/DesignerScreen.tsx
src/screen/DetailsScreen.tsx
src/screen/HomeScreen.tsx
src/screen/ProductsScreen.tsx
src/services/catalogApi.ts
src/services/commerceApi.ts
src/services/savedDesign.ts
src/store/catalogStore.ts
src/types/models.ts
tests/backend-images.spec.ts
tests/catalog.spec.ts
tests/commerce.spec.ts
docs/backend-images.md
```

## Verification

Run `npm run lint`, `npm run typecheck`, `npx expo export --platform web`, and `npx playwright test tests/backend-images.spec.ts tests/catalog.spec.ts tests/commerce.spec.ts --workers=1`.

The browser tests mock backend responses and transparent PNG downloads. They cover remote/missing/broken images, transparent image views, dragging, repositioning previews, duplicate instances, mixed components, removal, price updates, stock limits, saved ProductItems, saved-design images, and existing customer checkout/profile behavior. Physical iOS/Android rendering and live R2 images require device verification.
