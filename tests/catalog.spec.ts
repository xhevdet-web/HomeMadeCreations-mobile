import { expect, test } from '@playwright/test';

const category = {
  id: 'bracelets',
  name: 'Bracelets',
  description: 'Create your own bracelet',
  imageUrl: null,
  isActive: true,
  sortOrder: 1,
};
const bead = {
  ...category,
  id: 'gold',
  categoryId: 'bracelets',
  name: 'Shining bead',
  color: 'Gold',
  type: 'Glass',
  price: 150,
  stock: 3,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/products', route => route.fulfill({ json: [] }));
  await page.addInitScript(() =>
    localStorage.setItem(
      'homemade-onboarding-v1',
      JSON.stringify({ state: { completed: true }, version: 0 }),
    ),
  );
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { accessToken: 'test', expiresIn: 3600 } }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: { id: 'test', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com' },
    }),
  );
  await page.goto('/login');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByText(/Small beads\./)).toBeVisible();
});

test('catalog filters, sorts, falls back for images and caps bead quantities', async ({ page }) => {
  await page.route('**/api/v1/categories', async (route) => {
    expect(route.request().headers().authorization).toBeUndefined();
    await route.fulfill({
      json: [
        { ...category, id: 'later', name: 'Necklaces', sortOrder: 2 },
        { ...category, id: 'hidden', name: 'Hidden category', isActive: false },
        category,
      ],
    });
  });
  await page.route('**/api/v1/categories/bracelets/sub-categories', (route) =>
    route.fulfill({
      json: [
        { ...bead, id: 'sold', name: 'Sold bead', stock: 0, sortOrder: 2 },
        { ...bead, id: 'hidden', name: 'Hidden bead', isActive: false },
        { ...bead, imageUrl: 'https://images.example.test/broken.png' },
      ],
    }),
  );
  await page.route('https://images.example.test/**', (route) => route.abort());
  await page.getByRole('button', { name: 'Create your own', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Browse / })).toHaveText([
    /Bracelets/,
    /Necklaces/,
  ]);
  await expect(page.getByText('Hidden category', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Browse Bracelets' }).click();
  await expect(page).toHaveURL(/\/designer\?/);
  await expect(page.getByText('Choose your details')).toBeVisible();
  await expect(page.getByText('\u20ac1.50 per bead').first()).toBeVisible();
  await expect(page.getByText('Color: Gold').first()).toBeVisible();
  await expect(page.getByText('Type: Glass')).toHaveCount(0);
  await expect(page.getByText('3 available')).toBeVisible();
  await expect(page.getByText('Hidden bead', { exact: true })).toHaveCount(0);
  const increase = page.getByRole('button', { name: /^Add Shining bead,/ });
  await increase.click();
  await increase.click();
  await increase.click();
  await expect(page.getByText('3 / 32 DETAILS')).toBeVisible();
  await expect(increase).toBeDisabled();
  await expect(page.getByRole('button', { name: /^Add Sold bead,/ })).toBeDisabled();
  await expect(page.getByText('3 / 32 DETAILS')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Shining bead image', exact: true }).first()).toHaveAttribute(
    'src',
    /catalog-placeholder/,
  );
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('2 / 32 DETAILS')).toBeVisible();
  await expect(increase).toBeEnabled();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByText('3 / 32 DETAILS')).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByText('Estimated price: \u20ac4.50', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await page.getByRole('tab', { name: 'Create', exact: true }).click();
  await page.getByRole('button', { name: 'Continue my design' }).click();
  await expect(page.getByText('3 / 32 DETAILS')).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText('Estimated price: \u20ac4.50', { exact: true })).toBeVisible();
});

test('category and component errors retry into empty states', async ({ page }) => {
  let categories = 0;
  await page.route('**/api/v1/categories', (route) => {
    categories++;
    return categories === 1
      ? route.fulfill({ status: 500, json: {} })
      : route.fulfill({ json: categories === 2 ? [] : [category] });
  });
  let components = 0;
  await page.route('**/api/v1/categories/bracelets/sub-categories', (route) => {
    components++;
    return components === 1 ? route.abort() : route.fulfill({ json: [] });
  });
  await page.getByRole('button', { name: 'Create your own', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('500');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('No categories are available yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('button', { name: 'Browse Bracelets' }).click();
  await expect(page.getByRole('alert')).toContainText('Cannot reach');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('No components are available in this category yet.')).toBeVisible();
});


test('switching categories shows only the selected category in the designer', async ({ page }) => {
  await page.route('**/api/v1/categories', route => route.fulfill({ json: [
    category, { ...category, id: 'necklaces', name: 'Necklaces', sortOrder: 2 },
  ] }));
  await page.route('**/api/v1/categories/bracelets/sub-categories', route => route.fulfill({ json: [bead] }));
  await page.route('**/api/v1/categories/necklaces/sub-categories', route => route.fulfill({ json: [
    { ...bead, id: 'pearl-api', categoryId: 'necklaces', name: 'Necklace pearl' },
  ] }));
  await page.getByRole('button', { name: 'Create your own', exact: true }).click();
  await page.getByRole('button', { name: 'Browse Bracelets' }).click();
  await page.getByRole('button', { name: /^Add Shining bead,/ }).click();
  await expect(page.getByText('1 / 32 DETAILS')).toBeVisible();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Browse Necklaces' }).click();
  await expect(page.getByRole('button', { name: /^Add Necklace pearl,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add Shining bead,/ })).toHaveCount(0);
  await expect(page.getByText('0 / 32 DETAILS')).toBeVisible();
});
