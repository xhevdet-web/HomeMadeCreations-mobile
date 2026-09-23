# Initial mobile authentication

The app checks authentication before mounting navigation. Guests see Login.
All tabs and detail/designer/preview/checkout/confirmation routes are protected
using Expo Router Stack.Protected. No roles are inspected.

The old persisted local-profile simulation no longer grants access.
Passwords are sent to the API and are never persisted. Native access and optional
refresh tokens are stored together in Expo SecureStore. Profile data stays in
memory. AsyncStorage remains in use only for unrelated prototype data such as
theme, designs and orders.

## Backend integration

HomeMadeApi now implements POST /api/v1/auth/login and GET /api/v1/auth/me.
Login verifies the stored Argon2id password hash and returns an HS256 access token
with a 3600-second lifetime. Session validation checks signature, expiry, issuer,
audience, and current account activity. JWT_SECRET must be at least 32 bytes;
the local ignored backend .env is configured. No database migration was needed.

Set EXPO_PUBLIC_API_URL to the API root, including /api/v1, and restart Expo.
On a physical phone use the computer's LAN IP; localhost refers to the phone.
Use HTTPS for deployed environments. Browser development requires API CORS
configuration if the mobile web app and API use different origins.

Expected contract:

- POST /auth/login with { identifier, password } (identifier is email or username; legacy { email, password } requests remain supported): returns
  { accessToken, expiresIn, refreshToken? }. expiresIn is seconds.
  An absolute expiresAt timestamp in milliseconds is also accepted.
- GET /auth/me with Authorization: Bearer <accessToken>: validates the session
  server-side and returns { id, firstName, lastName, userName, email, phone, country, address, postalCode, isActive }.
  Do not substitute the public GET /users/:id endpoint for authentication.
- The existing POST /users is used for account creation only. Registration
  does not grant a session. The user signs in afterwards.

No refresh or server logout endpoint currently exists, so none is invented.
Expired/revoked/malformed sessions return to Login and local tokens are cleared.
Optional returned refresh tokens are secured but not used until a backend
refresh contract exists. Logout clears the local session; server-side token
revocation is a future backend step.

Secure storage and /auth/me are checked on startup and on app foregrounding.
A timer rechecks at access-token expiry. The loading state prevents protected
screens flashing before the check finishes. A failed check fails closed.

## Web preview

SecureStore does not provide a web backend. The web adapter keeps tokens only in
memory; browser reloads require Login. Neither localStorage, sessionStorage, nor
AsyncStorage receives tokens. Persistent browser authentication would require
a separate server-managed HttpOnly-cookie contract.

## Verification

- npm run test:auth: session lifecycle tests, including simulated native restart
  with the SecureStore adapter mocked, expiry, revocation, storage failure,
  logout and late-login race handling.
- npm run test:auth:web: exports the web app with a test-only API URL and runs
  Playwright auth tests using mocked HTTP responses.
- npm run typecheck and npm run lint.

The live LAN/PostgreSQL register-login-session flow has been verified with a
temporary account that was removed afterwards. Real device Keychain/Keystore
persistence still requires a device check. The older creation/theme browser
tests still assume guest browsing and simulated local registration; this auth
suite replaces those assumptions for authentication verification.

Expo references:
- https://docs.expo.dev/router/advanced/protected/
- https://docs.expo.dev/versions/latest/sdk/securestore/

## Registration profile fields

Registration accepts optional userName, phone, country, address and postalCode. Empty optional form fields are omitted. Usernames are trimmed, lowercased, and limited to 3?30 ASCII letters, digits, dots, underscores and hyphens; duplicates return 409. The login field accepts email or username. Accounts without a username can continue using email. Server address/country/postalCode fields populate the existing mobile address model after login or session restoration. No additional migration was created.
