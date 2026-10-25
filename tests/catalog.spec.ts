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

// A category opens its products first; "Create your own" opens its studio.
const createOwn = async (page: import('@playwright/test').Page, name: string) => {
  await page.getByRole('button', { name: `Browse ${name}` }).click();
  await page.getByRole('button', { name: `Create your own ${name} design` }).click();
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/products?**', route => route.fulfill({ json: [] }));
  await page.route(/\/api\/v1\/categories\/(bracelets|later|necklaces)$/, (route) => {
    const id = new URL(route.request().url()).pathname.split('/').pop()!;
    return route.fulfill({ json: { ...category, id, name: id === 'bracelets' ? 'Bracelets' : 'Necklaces' } });
  });
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
  await expect(page.getByText(/Your idea\./)).toBeVisible();
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
  await createOwn(page, 'Bracelets');
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
  await expect(page.getByText(/3 components/)).toBeVisible();
  await expect(increase).toBeDisabled();
  await expect(page.getByRole('button', { name: /^Add Sold bead,/ })).toBeDisabled();
  await expect(page.getByText(/3 components/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Shining bead image', exact: true }).first()).toHaveAttribute(
    'src',
    /catalog-placeholder/,
  );
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText(/2 components/)).toBeVisible();
  await expect(increase).toBeEnabled();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByText(/3 components/)).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByTestId('flow-action-footer').getByText('\u20ac4.50', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await page.getByRole('tab', { name: 'Create', exact: true }).click();
  await page.getByRole('button', { name: 'Continue my design' }).click();
  await expect(page.getByText(/3 components/)).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('flow-action-footer').getByText('\u20ac4.50', { exact: true })).toBeVisible();
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
  await createOwn(page, 'Bracelets');
  await expect(page.getByRole('alert')).toContainText('Cannot reach');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('No components are available in this category yet.')).toBeVisible();
});


test('a category shows "Create your own design" before its company products, filtered by the API', async ({ page }) => {
  await page.route('**/api/v1/categories', route => route.fulfill({ json: [category] }));
  const queries: Record<string, string>[] = [];
  await page.route('**/api/v1/products?**', (route) => {
    const query = Object.fromEntries(new URL(route.request().url()).searchParams);
    queries.push(query);
    return route.fulfill({ json: query.categoryId === 'bracelets' ? [{
      id: 'gold', name: 'Gold Bracelet', categoryId: 'bracelets', origin: 'COMPANY', isActive: true,
      price: 2500, stock: 3, imageUrl: null, items: [], itemCount: 0,
      category: { id: 'bracelets', name: 'Bracelets', builderType: 'JEWELRY' },
    }] : [] });
  });
  await page.getByRole('button', { name: 'Create your own', exact: true }).click();
  await page.getByRole('button', { name: 'Browse Bracelets' }).click();
  const create = page.getByRole('button', { name: 'Create your own Bracelets design' });
  const product = page.getByRole('button', { name: 'Gold Bracelet, €25.00' });
  await expect(create).toBeVisible();
  await expect(page.getByText('Explore Bracelets')).toBeVisible();
  await expect(product).toBeVisible();
  // The studio entry comes before the products.
  expect((await create.boundingBox())!.y).toBeLessThan((await product.boundingBox())!.y);
  expect(queries).toContainEqual({ categoryId: 'bracelets', origin: 'COMPANY', isActive: 'true' });
  await product.click();
  await expect(page).toHaveURL(/\/details\?/);
  await expect(page.getByText('3 available')).toBeVisible();
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
  await createOwn(page, 'Bracelets');
  await page.getByRole('button', { name: /^Add Shining bead,/ }).click();
  await expect(page.getByText('1 / 32 DETAILS')).toBeVisible();
  // Back to the Bracelets products, then back to the categories.
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await createOwn(page, 'Necklaces');
  await expect(page.getByRole('button', { name: /^Add Necklace pearl,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add Shining bead,/ })).toHaveCount(0);
  await expect(page.getByText('0 / 32 DETAILS')).toBeVisible();
});
