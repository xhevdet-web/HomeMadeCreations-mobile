# HomeMade Beads

A mobile-first Expo 57 / React Native prototype for designing handmade jewelry. The visual direction follows the supplied charcoal, amber, and gold reference. The catalog, saved designs, and orders remain local prototype data. Authentication uses a token-based API boundary; backend auth endpoints still need implementation.

## Run

```sh
npm install
npm start
```

Use `npm run web` for the browser. On Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.

The app checks its session before navigation and opens Login for guests. Native tokens use Expo SecureStore; authenticated sessions open Home. See [authentication setup and API contract](docs/authentication.md). The old local-profile sign-in simulation is removed.

## Prototype flow

Use the sun/moon button beside the bag on Discover to switch between charcoal/amber dark mode and ivory/blush light mode. Your choice is saved on the device and applies throughout the app. Theme palettes live in `src/constants/theme.ts`; components subscribe with `useTheme`, `useThemedStyles`, and `useUI` without remounting screens or resetting drafts.

1. Choose a bracelet or necklace and its size.
2. Open the studio. Tap components to add them to the circular or oval canvas.
3. Select a component on the canvas or numbered strip to replace, remove, or move it.
4. Undo, redo, or clear the design. Designs support up to 32 components.
5. Preview the exact selection, name it, and save it or add it to the bag.
6. Confirm delivery details and place a local demo order.
7. Revisit My Designs to edit, duplicate, delete/undo deletion, or order. Orders survive reloads; profile edits currently live only in the active session.

Jewelry is rendered using reusable SVG geometry and shaded beads, so the prototype works without external product-image URLs. Catalog `image` fields are procedural identifiers, not remote image assets. Drag-and-drop is a future enhancement; the current interaction is tap-to-add and tap-to-replace.

## Organization

| Folder | Responsibility |
| --- | --- |
| `src/app` | Expo Router routes and layouts only |
| `src/screen` | Screen composition |
| `src/components/common` | Shared controls, typography, layouts, and price breakdown |
| `src/components/designer` | JewelryCanvas, BraceletCanvas, NecklaceCanvas, DesignItem, BeadPicker |
| `src/components/products` | Product and saved-design cards |
| `src/helper` | Integer-cent pricing, IDs, and jewelry positioning |
| `src/constants` | Theme and delivery price |
| `src/data` | Four products, 20 beads, two spacers, and eight charms |
| `src/services` | Catalog boundary; also generates A–Z letter components |
| `src/store` | Separate Zustand stores for auth, draft, saved designs, cart, and orders |
| `src/types` | Domain models, including users, addresses, designs, and order snapshots |
| `src/hooks` | Persistence hydration |

All money is represented in integer euro cents. Order line prices and designs are snapshotted so later draft edits cannot change an order. Profiles have separate saved collections and orders; guest designs are shared on the device. Local storage is for the prototype and is not encrypted.

To connect a REST API later, replace the catalog boundary and store persistence/actions with repositories for the existing domain models. Add actual authentication and server-side availability, pricing, and order validation before using the app for real purchases.

## Checks

```sh
npm run typecheck
npm run lint
npm run test:e2e
```

The end-to-end suite exports the web app, serves it on localhost, and uses installed Chrome via Playwright. It checks pricing, add/replace/remove/reorder, undo/redo, registration, checkout, reload persistence, duplication/deletion, filters, and empty states. Screenshots and traces go to ignored `test-results/`.

Native iOS/Android device verification is still required. Use a matching Expo Go client or an SDK-compatible development build.

Dependencies were selected with the [Expo 57 SDK reference](https://docs.expo.dev/versions/v57.0.0/) and navigation follows [Expo Router layouts](https://docs.expo.dev/router/basics/navigation-layouts/).
