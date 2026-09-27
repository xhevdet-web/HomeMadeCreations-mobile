import { expect, test, Page } from '@playwright/test';

async function fixture(page: Page, mode: 'ok' | 'stock' | 'uncertain' = 'ok') {
  const category = { id: 'category-test', name: 'Bracelets', description: '', imageUrl: null, isActive: true, sortOrder: 1 };
  const components = [
    { ...category, id: 'black-api', categoryId: category.id, name: 'Black Panther', color: 'Black', type: 'Glass', price: 100, stock: 30 },
    { ...category, id: 'shining-api', categoryId: category.id, name: 'Shining bead', color: 'Gold', type: 'Glass', price: 150, stock: 40, sortOrder: 2 },
  ];
  let user = { id: 'customer-test', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com', phone: '', country: 'Poland', address: 'Main Street 1' };
  const products: any[] = [];
  const orders: any[] = [];
  const productBodies: any[] = [];
  const orderBodies: any[] = [];
  let stockReads = 0;
  await page.addInitScript(() => localStorage.setItem('homemade-onboarding-v1', JSON.stringify({ state: { completed: true }, version: 0 })));
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
    expect(req.headers().authorization).toBe('Bearer test-token');
    if (path === '/products' && req.method() === 'POST') {
      const body = req.postDataJSON();
      productBodies.push(body);
      const items = body.items.map((item: any, index: number) => ({
        ...item, id: 'item-' + index, unitPrice: components.find(c => c.id === item.subCategoryId)!.price,
        subCategory: components.find(c => c.id === item.subCategoryId),
      }));
      const product = { ...body, id: 'product-' + (products.length + 1), createdById: user.id, category, items,
        itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        price: items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0) };
      products.push(product);
      return route.fulfill({ status: 201, json: product });
    }
    if (path.startsWith('/products/')) return route.fulfill({ json: products.find(p => p.id === path.split('/').pop()) });
    if (path === '/users/customer-test/products') return route.fulfill({ json: products });
    if (path === '/users/customer-test' && req.method() === 'PATCH') {
      user = { ...user, ...req.postDataJSON() };
      return route.fulfill({ json: user });
    }
    if (path === '/orders' && req.method() === 'POST') {
      const body = req.postDataJSON();
      orderBodies.push(body);
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
  return { components, products, orders, productBodies, orderBodies, stockReads: () => stockReads };
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
  await page.getByLabel('Phone', { exact: true }).fill('+48123456789');
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
  expect(f.components.map(c => c.stock)).toEqual([30, 40]);
  await checkout(page);
  await page.getByLabel('Customer notes (optional)').fill('Call before delivery');
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('Your order has been placed.')).toBeVisible();
  await expect(page.getByText('HM-TEST-1')).toBeVisible();
  await expect(page.getByText('Total: €24.00')).toBeVisible();
  await expect(page.getByText('Payment status: UNPAID')).toBeVisible();
  expect(f.orderBodies).toEqual([{ productId: 'product-1', paymentType: 'CASH_ON_DELIVERY', customerNotes: 'Call before delivery' }]);
  expect(f.components.map(c => c.stock)).toEqual([18, 32]);
  await expect.poll(f.stockReads).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'View my orders', exact: true }).click();
  await page.getByRole('button', { name: 'Track HM-TEST-1' }).click();
  f.orders[0].status = 'CREATING';
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(page.getByText('Status: CREATING', { exact: true })).toBeVisible();
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
  await expect(page.getByText('2 / 32 DETAILS')).toBeVisible();
});

test('insufficient stock shows backend details and refreshes components', async ({ page }) => {
  const f = await fixture(page, 'stock');
  await build(page);
  await checkout(page);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Black Panther: requested 1, available 0');
  await expect.poll(f.stockReads).toBeGreaterThan(1);
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