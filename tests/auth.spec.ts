import { expect, test } from '@playwright/test';

test('guests and old local profiles cannot access protected routes', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'homemade-profile-v1',
      JSON.stringify({
        state: { user: { id: 'old-profile' }, profiles: [] },
        version: 0,
      }),
    ),
  );
  for (const route of [
    '/',
    '/profile',
    '/orders',
    '/designs',
    '/details',
    '/designer',
    '/preview',
    '/checkout',
    '/confirmation',
  ]) {
    await page.goto(route);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/Small beads\./)).toHaveCount(0);
  }
});

test('login validates session, opens Home, logout locks routes and clears memory', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      json: { accessToken: 'access-test', refreshToken: 'refresh-test', expiresIn: 3600 },
    }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: { id: 'test-user', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com' },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText(/Small beads\./)).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toContain('access-test');
  expect(stored).not.toContain('refresh-test');
  await page.getByRole('tab', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});

test('failed credentials never open the main app', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await expect(page).toHaveURL(/\/login$/);
});

test('web reload requires login because bearer tokens are not persisted on web', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { accessToken: 'access-test', expiresIn: 3600 } }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: { id: 'test-user', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com' },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText(/Small beads\./)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});

test('registration sends account details to Users API and shows success', async ({ page }) => {
  let payload: unknown;
  await page.route('**/api/v1/users', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { id: 'registered-user' } });
  });
  await page.goto('/register');
  await page.getByLabel('First name', { exact: true }).fill(' Mila ');
  await page.getByLabel('Username (optional)', { exact: true }).fill('Mila.Stone');
  await page.getByLabel('Phone (optional)', { exact: true }).fill('044123456');
  await page.getByLabel('Country (optional)', { exact: true }).fill('Kosovo');
  await page.getByLabel('Address (optional)', { exact: true }).fill('12 Main Street');
  await page.getByLabel('Postal code (optional)', { exact: true }).fill('10000');
  await page.getByLabel('Last name', { exact: true }).fill('Stone');
  await page.getByLabel('Email address', { exact: true }).fill('MILA@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByLabel('Confirm password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByRole('alert')).toHaveText('Account created. You can now sign in.');
  expect(payload).toEqual({
    firstName: 'Mila',
    lastName: 'Stone',
    email: 'mila@example.com',
    password: 'ValidPassword123!',
    userName: 'mila.stone',
    phone: '044123456',
    country: 'Kosovo',
    address: '12 Main Street',
    postalCode: '10000',
  });
  await expect(page).toHaveURL(/\/register$/);
});

test('registration displays backend validation errors', async ({ page }) => {
  await page.route('**/api/v1/users', (route) =>
    route.fulfill({
      status: 400,
      json: { message: ['firstName must be shorter than or equal to 100 characters'] },
    }),
  );
  await page.goto('/register');
  await page.getByLabel('First name', { exact: true }).fill('A'.repeat(101));
  await page.getByLabel('Last name', { exact: true }).fill('Stone');
  await page.getByLabel('Email address', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByLabel('Confirm password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByRole('alert')).toContainText('firstName must be shorter');
});

test('login accepts a username and submits it as identifier', async ({ page }) => {
  let payload: unknown;
  await page.route('**/api/v1/auth/login', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { accessToken: 'test-token', expiresIn: 3600 } });
  });
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: {
        id: 'test-user',
        firstName: 'Mila',
        lastName: 'Stone',
        email: 'mila@example.com',
        userName: 'mila.stone',
        country: 'Kosovo',
        address: '12 Main Street',
        postalCode: '10000',
      },
    }),
  );
  await page.goto('/login');
  await page.getByLabel('Email or username', { exact: true }).fill('Mila.Stone');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText(/Small beads\./)).toBeVisible();
  expect(payload).toEqual({ identifier: 'mila.stone', password: 'ValidPassword123!' });
  await page.getByRole('tab', { name: 'Profile', exact: true }).click();
  await expect(page.getByLabel('Street address', { exact: true })).toHaveValue('12 Main Street');
});
