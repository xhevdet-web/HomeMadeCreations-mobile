import { expect, test } from '@playwright/test';

for (const mode of ['success', 'stock', 'uncertain', 'profile'] as const) {
  test(`ready-made purchase: ${mode}`, async ({ page }) => {
    const user = {
      id: 'customer',
      firstName: 'Mila',
      lastName: 'Stone',
      email: 'mila@example.com',
      phone: mode === 'profile' ? '' : '123456789',
      country: 'Poland',
      address: 'Main Street 1',
    };
    const product = {
      id: 'ready',
      name: 'Ready bracelet',
      description: 'Handcrafted bracelet',
      categoryId: 'bracelets',
      createdById: 'admin',
      origin: 'COMPANY',
      isActive: true,
      stock: 2,
      color: 'Blue',
      price: 2500,
      imageUrl: null,
      items: [],
      itemCount: 0,
    };
    let submissions = 0;
    let stockReads = 0;
    const order = {
      ...user,
      id: 'order-ready',
      userId: user.id,
      productId: product.id,
      product,
      orderNumber: 'HM-READY-1',
      totalPrice: 2500,
      paymentType: 'CASH_ON_DELIVERY',
      paymentStatus: 'UNPAID',
      status: 'ORDERED',
      createdAt: new Date().toISOString(),
    };
    order.id = 'order-ready';
    await page.addInitScript(() =>
      localStorage.setItem(
        'homemade-onboarding-v1',
        JSON.stringify({ state: { completed: true }, version: 0 }),
      ),
    );
    await page.route('**/api/v1/**', async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname.replace('/api/v1', '');
      if (path === '/auth/login')
        return route.fulfill({ json: { accessToken: 'test-token', expiresIn: 3600 } });
      if (path === '/auth/me') return route.fulfill({ json: user });
      if (path === '/products' && req.method() === 'GET') {
        // The API returns only active company products; sold-out ones are hidden by the app.
        expect(Object.fromEntries(new URL(req.url()).searchParams)).toMatchObject({
          origin: 'COMPANY', isActive: 'true',
        });
        return route.fulfill({
          json: [product, { ...product, id: 'sold-out', name: 'Hidden sold out', stock: 0 }],
        });
      }
      if (path === '/products/ready') {
        stockReads++;
        return route.fulfill({ json: product });
      }
      if (path === '/orders' && req.method() === 'POST') {
        submissions++;
        expect(req.postDataJSON()).toEqual({
          productId: 'ready',
          paymentType: 'CASH_ON_DELIVERY',
          customerNotes: 'Doorbell',
        });
        if (mode === 'uncertain') return route.abort();
        if (mode === 'stock') {
          product.stock = 0;
          return route.fulfill({ status: 409, json: { message: 'Insufficient stock' } });
        }
        return route.fulfill({ status: 201, json: order });
      }
      if (path === '/orders/order-ready') return route.fulfill({ json: order });
      if (path === '/orders')
        return route.fulfill({
          json: {
            data: submissions ? [order] : [],
            meta: { page: 1, totalPages: 1, total: submissions },
          },
        });
      throw new Error(`Unexpected request ${req.method()} ${path}`);
    });
    await page.goto('/login');
    await page.getByLabel('Email or username', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Order Ready bracelet', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Hidden sold out')).toHaveCount(0);
    await page.getByRole('button', { name: 'Preview Ready bracelet image', exact: true }).click();
    await expect(page.getByTestId('product-image-preview')).toBeVisible();
    await expect(page).not.toHaveURL(/\/details/);
    await page.getByRole('button', { name: 'Close image preview', exact: true }).click();
    await expect(page.getByTestId('product-image-preview')).toHaveCount(0);
    await page.getByRole('button', { name: 'Order Ready bracelet', exact: true }).click();
    await expect(page.getByText('Blue', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Order Now', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Design', exact: true })).toHaveCount(0);
    if (mode === 'profile') {
      await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Add delivery details' })).toBeVisible();
      expect(submissions).toBe(0);
      return;
    }
    await page.getByRole('button', { name: 'Add a delivery note', exact: true }).click();
    await page.getByLabel('Customer notes (optional)', { exact: true }).fill('Doorbell');
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    if (mode === 'success') {
      await expect(page.getByRole('button', { name: 'Track order', exact: true })).toBeVisible();
      await expect(page.getByText('HM-READY-1')).toBeVisible();
      await expect(page.getByText('Your order has been placed.')).toBeVisible();
    } else {
      if (mode === 'stock') {
        await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
        await expect(page.getByText('Out of stock', { exact: true })).toBeVisible();
        expect(stockReads).toBeGreaterThan(2);
      } else {
        await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Check my orders' })).toBeVisible();
        await expect(
          page
            .getByTestId('flow-toast')
            .getByText(/We could not confirm whether your order was placed/),
        ).toBeVisible();
      }
    }
    expect(submissions).toBe(1);
  });
}

test('a sized company product is ordered in the chosen size', async ({ page }) => {
  const user = {
    id: 'customer', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com',
    phone: '123456789', country: 'Poland', address: 'Main Street 1',
  };
  const hoodie = {
    id: 'black-hoodie', name: 'Black Essential Hoodie', categoryId: 'hoodies', createdById: 'admin',
    origin: 'COMPANY', isActive: true, stock: 0, color: 'Black', colorHex: '#111111', price: 3500,
    sizes: [{ size: 'S', stock: 0 }, { size: 'M', stock: 28 }], imageUrl: null, items: [], itemCount: 0,
    category: { id: 'hoodies', name: 'Hoodies', builderType: 'APPAREL' },
  };
  let body: unknown;
  await page.addInitScript(() =>
    localStorage.setItem('homemade-onboarding-v1', JSON.stringify({ state: { completed: true }, version: 0 })),
  );
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/api/v1', '');
    if (path === '/auth/login') return route.fulfill({ json: { accessToken: 'test-token', expiresIn: 3600 } });
    if (path === '/auth/me') return route.fulfill({ json: user });
    if (path === '/products' && req.method() === 'GET') return route.fulfill({ json: [hoodie] });
    if (path === '/products/black-hoodie') return route.fulfill({ json: hoodie });
    if (path === '/orders' && req.method() === 'POST') {
      body = req.postDataJSON();
      return route.fulfill({ status: 201, json: {
        ...user, id: 'order-hoodie', userId: user.id, productId: hoodie.id, orderNumber: 'HM-HOODIE-1',
        totalPrice: 3500, paymentType: 'CASH_ON_DELIVERY', paymentStatus: 'UNPAID', status: 'ORDERED',
        createdAt: new Date().toISOString(), product: { ...hoodie, selectedSize: { id: 'M', name: 'M' } },
      } });
    }
    if (path.startsWith('/orders')) return route.fulfill({ json: { data: [], meta: { page: 1, totalPages: 1, total: 0 } } });
    throw new Error(`Unexpected request ${req.method()} ${path}`);
  });
  await page.goto('/login');
  await page.getByLabel('Email or username', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await page.getByRole('button', { name: 'Order Black Essential Hoodie', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Choose a size', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Size S, sold out' })).toBeDisabled();
  await page.getByRole('button', { name: 'Size M, 28 available' }).click();
  await page.getByRole('button', { name: 'Order Now', exact: true }).click();
  await expect(page.getByText('Size M')).toBeVisible();
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('HM-HOODIE-1')).toBeVisible();
  expect(body).toEqual({ productId: 'black-hoodie', paymentType: 'CASH_ON_DELIVERY', size: 'M' });
});
