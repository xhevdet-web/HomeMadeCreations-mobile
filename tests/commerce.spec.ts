import { expect, test, Page } from '@playwright/test';

async function fixture(page: Page, mode: 'ok' | 'stock' | 'uncertain' | 'profile' = 'ok') {
  const category = { id: 'category-test', name: 'Bracelets', description: '', imageUrl: null, isActive: true, sortOrder: 1 };
  const components = [
    { ...category, id: 'black-api', categoryId: category.id, name: 'Black Panther', color: 'Black', type: 'Glass', price: 100, stock: 30 },
    { ...category, id: 'shining-api', categoryId: category.id, name: 'Shining bead', color: 'Gold', type: 'Glass', price: 150, stock: 40, sortOrder: 2 },
  ];
  let user = { id: 'customer-test', role: 'CUSTOMER', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com', phone: mode === 'profile' ? '' : '+48123456789', country: 'Poland', address: 'Main Street 1' };
  const products: any[] = [];
  const orders: any[] = [];
  const productBodies: any[] = [];
  const previewDimensions: number[][] = [];
  const orderBodies: any[] = [];
  const profileBodies: any[] = [];
  let stockReads = 0;
  await page.addInitScript(() => localStorage.setItem('homemade-onboarding-v1', JSON.stringify({ state: { completed: true }, version: 0 })));
  await page.route('https://images.example.test/**', route => route.fulfill({
    contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' },
    path: 'assets/catalog-placeholder.png',
  }));
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api/v1', '');
    if (path === '/auth/login') return route.fulfill({ json: { accessToken: 'test-token', expiresIn: 3600 } });
    if (path === '/auth/me') return route.fulfill({ json: user });
    if (path === '/categories') return route.fulfill({ json: [category] });
    if (path === '/categories/category-test') return route.fulfill({ json: category });
    if (path === '/categories/category-test/sub-categories') {
      stockReads++;
      return route.fulfill({ json: components });
    }
    if (path === '/products' && req.method() === 'GET') return route.fulfill({ json: products });
    expect(req.headers().authorization).toBe('Bearer test-token');
    if (path === '/products' && req.method() === 'POST') {
      const data = await new Response(req.postDataBuffer(), {
        headers: { 'Content-Type': req.headers()['content-type'] },
      }).formData() as unknown as { get(key: string): string | File | null; has(key: string): boolean };
      expect(req.headers()['content-type']).toMatch(/^multipart\/form-data; boundary=/);
      const preview = data.get('designPreview') as File;
      expect(preview?.name).toBe('design-preview.png');
      expect(preview?.type).toBe('image/png');
      expect(preview?.size).toBeGreaterThan(100);
      const bytes = new Uint8Array(await preview.arrayBuffer());
      expect([...bytes.slice(0, 4)]).toEqual([137, 80, 78, 71]);
      const view = new DataView(bytes.buffer);
      previewDimensions.push([view.getUint32(16), view.getUint32(20)]);
      const body = { categoryId: data.get('categoryId'), name: data.get('name'),
        ...(data.has('description') ? { description: data.get('description') } : {}),
        items: JSON.parse(data.get('items') as string) };
      productBodies.push(body);
      const items = body.items.map((item: any, index: number) => ({
        ...item, id: 'item-' + index, unitPrice: components.find(c => c.id === item.subCategoryId)!.price,
        subCategory: components.find(c => c.id === item.subCategoryId),
      }));
      const product = { ...body, designPreviewUrl: 'https://images.example.test/saved-preview.png', id: 'product-' + (products.length + 1), createdById: user.id, category, items,
        itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        price: items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0) };
      products.push(product);
      return route.fulfill({ status: 201, json: product });
    }
    if (path.startsWith('/products/')) return route.fulfill({ json: products.find(p => p.id === path.split('/').pop()) });
    if (path === '/users/customer-test/products') return route.fulfill({ json: products });
    if (path === '/users/me' && req.method() === 'PATCH') {
      profileBodies.push(req.postDataJSON());
      user = { ...user, ...req.postDataJSON() };
      return route.fulfill({ json: user });
    }
    if (path.startsWith('/users/') && req.method() === 'PATCH')
      return route.fulfill({ status: 403, json: { message: 'Only administrators can manage users' } });
    if (path === '/orders' && req.method() === 'POST') {
      const body = req.postDataJSON();
      orderBodies.push(body);
      if (!user.phone) return route.fulfill({ status: 400, json: { message: 'Complete firstName, lastName, phone, country and address in your profile before ordering' } });
      if (mode === 'uncertain') return route.abort();
      if (mode === 'stock') {
        components[0].stock = 0;
        return route.fulfill({ status: 400, json: { message: 'Insufficient inventory for Black Panther: requested 1, available 0' } });
      }
      const product = products.find(p => p.id === body.productId);
      const order = { ...user, id: 'order-1', userId: user.id, productId: product.id, product,
        orderNumber: 'HM-TEST-1', totalPrice: product.price, paymentType: body.paymentType,
        paymentStatus: 'UNPAID', status: 'ORDERED', createdAt: new Date().toISOString() };
      orders.push(order);
      for (const item of product.items) components.find(c => c.id === item.subCategoryId)!.stock -= item.quantity;
      await new Promise(resolve => setTimeout(resolve, 200));
      return route.fulfill({ status: 201, json: order });
    }
    if (path === '/orders') {
      const current = Number(url.searchParams.get('page') ?? 1);
      return route.fulfill({ json: { data: orders.slice((current - 1) * 20, current * 20),
        meta: { page: current, totalPages: Math.ceil(orders.length / 20), total: orders.length } } });
    }
    if (path === '/orders/order-1') return route.fulfill({ json: orders[0] });
    return route.fulfill({ status: 404, json: { message: 'Unexpected test request: ' + path } });
  });
  await page.goto('/login');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await page.getByRole('button', { name: 'Create your own', exact: true }).click();
  await page.getByRole('button', { name: 'Browse Bracelets' }).click();
  await expect(page.getByText('Choose your details')).toBeVisible();
  return { components, products, orders, productBodies, previewDimensions, orderBodies, profileBodies, stockReads: () => stockReads };
}
async function build(page: Page, black = 1, shining = 1) {
  for (let i = 0; i < black; i++) await page.getByRole('button', { name: /^Add Black Panther,/ }).click();
  for (let i = 0; i < shining; i++) await page.getByRole('button', { name: /^Add Shining bead,/ }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByLabel('Give your creation a name').fill('My bracelet');
}
async function checkout(page: Page) {
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByText('Cash on Delivery', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Phone', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('First name', { exact: true })).toHaveCount(0);
  await expect(page.getByText('mila@example.com', { exact: true })).toHaveCount(0);
}

test('save, COD checkout, backend totals, stock refresh and tracking', async ({ page }) => {
  const f = await fixture(page);
  await expect(page.getByText('Type: Glass')).toHaveCount(0);
  await expect(page.getByText(/Estimated subtotal/)).toHaveCount(0);
  await build(page, 12, 8);
  await expect(page.getByText('Total beads: 20', { exact: true })).toBeVisible();
  await expect(page.getByText('Estimated price: €24.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByText('Saved price: €24.00')).toBeVisible();
  expect(f.productBodies).toEqual([{ categoryId: 'category-test', name: 'My bracelet', items: [
    { subCategoryId: 'black-api', quantity: 12, position: 0 },
    { subCategoryId: 'shining-api', quantity: 8, position: 12 },
  ] }]);
  expect(f.previewDimensions).toEqual([[840, 840]]);
  expect(f.components.map(c => c.stock)).toEqual([30, 40]);
  await checkout(page);
  await page.getByLabel('Customer notes (optional)').fill('Call before delivery');
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('Your order has been placed.')).toBeVisible();
  await expect(page.getByRole('img', { name: 'My bracelet image' })).toHaveAttribute('src', 'https://images.example.test/saved-preview.png');
  await expect(page.getByRole('button', { name: 'Edit Design' })).toHaveCount(0);
  await expect(page.getByText('HM-TEST-1')).toBeVisible();
  await expect(page.getByText('Total: €24.00')).toBeVisible();
  await expect(page.getByText('Payment status: UNPAID')).toBeVisible();
  expect(f.orderBodies).toEqual([{ productId: 'product-1', paymentType: 'CASH_ON_DELIVERY', customerNotes: 'Call before delivery' }]);
  expect(f.profileBodies).toHaveLength(0);
  expect(f.components.map(c => c.stock)).toEqual([18, 32]);
  await expect.poll(f.stockReads).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'View my orders', exact: true }).click();
  await expect(page.getByRole('img', { name: 'My bracelet image' })).toHaveAttribute('src', 'https://images.example.test/saved-preview.png');
  await page.getByRole('button', { name: 'Track HM-TEST-1' }).click();
  f.orders[0].status = 'CREATING';
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(page.getByText('Status: Being made', { exact: true })).toBeVisible();
  expect(f.orderBodies).toHaveLength(1);
});

test('changing a saved design creates a new product', async ({ page }) => {
  const f = await fixture(page);
  await build(page);
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Design saved', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add one Black Panther', exact: true }).click();
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect.poll(() => f.products.length).toBe(2);
  expect(f.productBodies[1].items.filter((item: any) => item.subCategoryId === 'black-api')
    .reduce((sum: number, item: any) => sum + item.quantity, 0)).toBe(2);
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('tab', { name: 'My Designs', exact: true }).click();
  await page.getByRole('button', { name: 'Edit a copy of My bracelet', exact: true }).first().click();
  await expect(page.getByText('2 / 32 DETAILS').last()).toBeVisible();
});

test('insufficient stock shows backend details and refreshes components', async ({ page }) => {
  const f = await fixture(page, 'stock');
  await build(page);
  await checkout(page);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Black Panther: requested 1, available 0');
  await expect.poll(f.stockReads).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Edit Design', exact: true }).click();
  await expect(page.getByText('2 / 32 DETAILS').last()).toBeVisible();
  expect(f.orderBodies).toHaveLength(1);
});

test('uncertain order submission is never automatically retried, even after returning', async ({ page }) => {
  const f = await fixture(page, 'uncertain');
  await build(page);
  await checkout(page);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not confirm whether your order was placed');
  await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'My Orders', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
  expect(f.orderBodies).toHaveLength(1);
});

test('order list follows backend pagination metadata', async ({ page }) => {
  const f = await fixture(page);
  await build(page);
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Design saved', exact: true })).toBeVisible();
  for (let index = 1; index <= 21; index++) f.orders.push({
    id: 'history-' + index, orderNumber: 'HISTORY-' + index, userId: 'customer-test',
    productId: f.products[0].id, product: f.products[0], totalPrice: 250,
    status: 'ORDERED', paymentStatus: 'UNPAID', paymentType: 'CASH_ON_DELIVERY',
    firstName: 'Mila', lastName: 'Stone', phone: '123', address: 'Main Street 1', country: 'Poland',
  });
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('tab', { name: 'Orders', exact: true }).click();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(page.getByText('HISTORY-21', { exact: true })).toBeVisible();
  await expect(page.getByText('HISTORY-1', { exact: true })).toHaveCount(0);
});

test('customer completes their own profile separately then returns to order', async ({ page }) => {
  const f = await fixture(page, 'profile');
  await build(page);
  await checkout(page);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('in your profile before ordering');
  expect(f.profileBodies).toHaveLength(0);
  await page.getByRole('button', { name: 'Update my profile' }).click();
  await page.getByLabel('Phone', { exact: true }).fill('+48111222333');
  await page.getByRole('button', { name: 'Save my details' }).click();
  await expect(page.getByText('Your details have been saved.')).toBeVisible();
  expect(f.profileBodies).toHaveLength(1);
  expect(f.profileBodies[0]).toEqual({ phone: '+48111222333' });
  await page.getByRole('button', { name: 'Return to order' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel('Phone', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('Your order has been placed.')).toBeVisible();
  expect(f.profileBodies).toHaveLength(1);
  expect(f.orders).toHaveLength(1);
});

test('customer can edit one profile field without completing delivery and clear postal code', async ({ page }) => {
  const f = await fixture(page, 'profile');
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('tab', { name: 'Profile', exact: true }).click();
  await page.getByLabel('First name', { exact: true }).fill('Mila Updated');
  await page.getByRole('button', { name: 'Save my details' }).click();
  await expect(page.getByText('Your details have been saved.')).toBeVisible();
  expect(f.profileBodies).toEqual([{ firstName: 'Mila Updated' }]);
  await expect(page.getByLabel('Phone', { exact: true })).toHaveValue('');
  await page.getByLabel('Postal code (optional)').fill('10000');
  await page.getByRole('button', { name: 'Save my details' }).click();
  await expect.poll(() => f.profileBodies.length).toBe(2);
  await expect(page.getByRole('button', { name: 'Save my details' })).toBeEnabled();
  await page.getByLabel('Postal code (optional)').fill('');
  await page.getByRole('button', { name: 'Save my details' }).click();
  await expect.poll(() => f.profileBodies.length).toBe(3);
  expect(f.profileBodies[2]).toEqual({ postalCode: null });
  await page.getByRole('button', { name: 'Save my details' }).click();
  await expect(page.getByText('No changes to save.')).toBeVisible();
  expect(f.profileBodies).toHaveLength(3);
});
test('failed preview capture retains the editable design and can be retried', async ({ page }) => {
  const f = await fixture(page);
  await build(page, 2, 1);
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toDataURL;
    (window as any).restoreDesignCapture = () => { HTMLCanvasElement.prototype.toDataURL = original; };
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      if (this.width === 840 && this.height === 840) throw new Error('Capture unavailable');
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not capture your design preview');
  await expect(page.getByText('Total beads: 3', { exact: true })).toBeVisible();
  expect(f.productBodies).toHaveLength(0);
  await page.evaluate(() => (window as any).restoreDesignCapture());
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByText('Saved price: \u20ac3.50')).toBeVisible();
  expect(f.productBodies).toHaveLength(1);
  expect(f.components.map(c => c.stock)).toEqual([30, 40]);
});

test('order review remains editable and saves a new preview before placing an order', async ({ page }) => {
  const f = await fixture(page);
  await build(page, 1, 1);
  await checkout(page);
  await expect(page.getByRole('img', { name: 'My bracelet image' })).toHaveAttribute('src', 'https://images.example.test/saved-preview.png');
  await page.getByRole('button', { name: 'Edit Design', exact: true }).click();
  await expect(page.getByText('2 / 32 DETAILS').last()).toBeVisible();
  await page.getByRole('button', { name: /^Add Black Panther,/ }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByText('Total beads: 3', { exact: true }).last()).toBeVisible();
  await expect.poll(() => f.productBodies.length).toBe(2);
  expect(f.previewDimensions).toEqual([[840, 840], [840, 840]]);
  expect(f.products[0].itemCount).toBe(2);
  expect(f.products[1].itemCount).toBe(3);
  expect(f.components.map(c => c.stock)).toEqual([30, 40]);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('Your order has been placed.')).toBeVisible();
  expect(f.orderBodies[0].productId).toBe(f.products[1].id);
  await expect(page.getByRole('button', { name: 'Back to Home', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View Order', exact: true }).click();
  await expect(page.getByText('Status: Ordered', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Design' })).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'My bracelet image' })).toHaveAttribute('src', 'https://images.example.test/saved-preview.png');
});

test('moving a bead without changing quantities saves a fresh visual preview', async ({ page }) => {
  const f = await fixture(page);
  await build(page, 1, 1);
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Design saved', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keep creating', exact: true }).click();
  const placed = (await page.getByTestId(/^placed-/).first().boundingBox())!;
  await page.mouse.move(placed.x + placed.width / 2, placed.y + placed.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  await page.mouse.move(placed.x + placed.width / 2 - 12, placed.y + placed.height / 2 + 12, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText('Detail moved. Hold and drag it again to adjust its position.')).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Save design', exact: true }).click();
  await expect(page.getByText('Saved price: \u20ac2.50')).toBeVisible();
  expect(f.productBodies).toHaveLength(2);
  expect(f.productBodies[1].items).toEqual(f.productBodies[0].items);
  expect(f.previewDimensions).toEqual([[840, 840], [840, 840]]);
});
