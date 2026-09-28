import { expect, test, Page } from '@playwright/test';

const imageUrl = 'https://images.example.test/bead.png';
const productUrl = 'https://images.example.test/product.png';
const category = { id: 'image-category', name: 'Bracelets', description: 'Make a bracelet', imageUrl, isActive: true, sortOrder: 1 };
const components = [
  { ...category, id: 'gold-image', categoryId: category.id, name: 'Gold bead', color: 'Gold', type: 'Glass', price: 150, stock: 3 },
  { ...category, id: 'pearl-image', categoryId: category.id, name: 'Pearl bead', color: 'Ivory', type: 'Pearl', price: 200, stock: 2 },
];
const product = { id: 'image-product', createdById: 'image-user', categoryId: category.id, category,
  name: 'Image bracelet', description: 'Backend design', imageUrl: productUrl, isActive: true,
  price: 150, itemCount: 1, items: [{ id: 'saved-item', subCategoryId: components[0].id,
    quantity: 1, position: 0, unitPrice: 150, subCategory: components[0] }] };

async function setup(page: Page) {
  const bodies: { items: { subCategoryId: string; quantity: number; position: number }[] }[] = [];
  await page.addInitScript(() => localStorage.setItem('homemade-onboarding-v1', JSON.stringify({ state: { completed: true }, version: 0 })));
  await page.route('https://images.example.test/**', route => route.request().url().includes('broken')
    ? route.abort() : route.fulfill({ contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' }, path: 'assets/catalog-placeholder.png' }));
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/api/v1', '');
    if (path === '/auth/login') return route.fulfill({ json: { accessToken: 'image-token', expiresIn: 3600 } });
    if (path === '/auth/me') return route.fulfill({ json: { id: 'image-user', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com' } });
    if (path === '/categories') return route.fulfill({ json: [category,
      { ...category, id: 'no-image', name: 'No image', imageUrl: null },
      { ...category, id: 'broken-image', name: 'Broken image', imageUrl: 'https://images.example.test/broken.png' }] });
    if (path === '/categories/' + category.id) return route.fulfill({ json: category });
    if (path.endsWith('/sub-categories')) return route.fulfill({ json: components });
    if (path === '/products' && req.method() === 'POST') {
      expect(req.headers().authorization).toBe('Bearer image-token');
      const data = await new Response(req.postDataBuffer(), {
        headers: { 'Content-Type': req.headers()['content-type'] },
      }).formData() as unknown as { get(key: string): string | File | null; has(key: string): boolean };
      const preview = data.get('designPreview') as File;
      expect(preview?.name).toBe('design-preview.png');
      expect(preview?.size).toBeGreaterThan(100);
      const body = { categoryId: data.get('categoryId'), name: data.get('name'),
        items: JSON.parse(data.get('items') as string) };
      bodies.push(body);
      expect(body).not.toHaveProperty('price');
      expect(body).not.toHaveProperty('imageUrl');
      expect(body).not.toHaveProperty('imageKey');
      const items = body.items.map((item: typeof product.items[0], index: number) => ({ ...item, id: String(index),
        subCategory: components.find(c => c.id === item.subCategoryId),
        unitPrice: components.find(c => c.id === item.subCategoryId)!.price }));
      return route.fulfill({ json: { ...product, ...body, designPreviewUrl: productUrl, items,
        price: items.reduce((sum: number, item: typeof product.items[0]) => sum + item.quantity * item.unitPrice, 0),
        itemCount: items.reduce((sum: number, item: typeof product.items[0]) => sum + item.quantity, 0) } });
    }
    if (path === '/products') return route.fulfill({ json: [product] });
    if (path === '/products/' + product.id) return route.fulfill({ json: product });
    if (path === '/users/image-user/products') return route.fulfill({ json: [product] });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/login');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Password123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByText(/Your idea\./)).toBeVisible();
  return bodies;
}

test('backend images flow through cards, drag ghosts, canvas and saved ProductItems', async ({ page }) => {
  const bodies = await setup(page);
  await expect(page.getByRole('img', { name: 'Image bracelet image' }).first()).toHaveAttribute('src', productUrl);
  await page.getByRole('button', { name: 'Create your own', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Bracelets image' })).toHaveAttribute('src', imageUrl);
  for (const name of ['No image image', 'Broken image image'])
    await expect(page.getByRole('img', { name })).toHaveAttribute('src', /catalog-placeholder/);
  await page.getByRole('button', { name: 'Browse Bracelets' }).click();
  const pick = page.getByRole('button', { name: /^Add Gold bead,/ });
  await expect(pick.getByRole('img')).toHaveAttribute('src', imageUrl);
  await expect(pick.getByRole('img')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const source = (await pick.boundingBox())!;
  const canvas = page.getByLabel('bracelet with 0 components', { exact: true });
  const target = (await canvas.boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
  await expect(page.getByTestId('drag-preview').getByRole('img')).toHaveAttribute('src', imageUrl);
  await page.mouse.up();
  await expect(page.getByText('1 / 32 DETAILS')).toBeVisible();
  await expect(page.getByTestId(/^placed-/).getByRole('img')).toHaveAttribute('src', imageUrl);
  await page.waitForTimeout(550); // The existing drag guard suppresses the release tap.
  await pick.click(); await pick.click();
  await expect(page.getByText('3 / 32 DETAILS')).toBeVisible();
  await expect(pick).toBeDisabled();
  await page.getByRole('button', { name: /^Add Pearl bead,/ }).click();
  await expect(page.getByTestId(/^placed-/)).toHaveCount(4);
  const ids = await page.getByTestId(/^placed-/).evaluateAll(nodes => nodes.map(n => n.getAttribute('data-testid')));
  expect(new Set(ids).size).toBe(4);
  const placed = (await page.getByTestId(/^placed-/).first().boundingBox())!;
  await page.mouse.move(placed.x + placed.width / 2, placed.y + placed.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  await page.mouse.move(placed.x + placed.width / 2 - 12, placed.y + placed.height / 2 + 12, { steps: 8 });
  await expect(page.getByTestId('reorder-preview').getByRole('img')).toHaveAttribute('src', imageUrl);
  await page.mouse.up();
  await expect(page.getByText('Detail moved. Hold and drag it again to adjust its position.')).toBeVisible();
  await page.getByRole('button', { name: 'Finish selecting', exact: true }).click();
  await page.getByRole('button', { name: 'Select position 1, Gold bead', exact: true }).click();
  await page.getByRole('button', { name: 'Remove selected detail', exact: true }).click();
  await expect(page.getByTestId(/^placed-/)).toHaveCount(3);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText('Estimated price: €5.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByText('Saved price: €5.00')).toBeVisible();
  expect(bodies[0].items).toEqual([
    { subCategoryId: 'gold-image', quantity: 2, position: 0 },
    { subCategoryId: 'pearl-image', quantity: 1, position: 2 },
  ]);
  expect(components.map(c => c.stock)).toEqual([3, 2]);
});

test('backend product images display in product details and My Designs', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: /Customize Image bracelet/ }).click();
  await expect(page.getByRole('img', { name: 'Image bracelet image' })).toHaveAttribute('src', productUrl);
  await page.getByRole('button', { name: 'Create your design', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Add Gold bead,/ })).toBeVisible();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('tab', { name: 'My Designs', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Image bracelet image' })).toHaveAttribute('src', productUrl);
  await page.getByRole('button', { name: 'Edit a copy of Image bracelet' }).click();
  await expect(page.getByTestId(/^placed-/).getByRole('img')).toHaveAttribute('src', imageUrl);
});
