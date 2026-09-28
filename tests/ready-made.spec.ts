import { expect, test } from '@playwright/test';

for (const mode of ['success', 'stock', 'uncertain', 'profile'] as const) {
  test(`ready-made purchase: ${mode}`, async ({ page }) => {
    const user = { id: 'customer', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com', phone: mode === 'profile' ? '' : '123456789', country: 'Poland', address: 'Main Street 1' };
    const product = { id: 'ready', name: 'Ready bracelet', description: 'Handcrafted bracelet', categoryId: 'bracelets', createdById: 'admin', productType: 'READY_MADE', isActive: true, stock: 2, color: 'Blue', price: 2500, imageUrl: null, items: [], itemCount: 0 };
    let submissions = 0;
    let stockReads = 0;
    const order = { ...user, id: 'order-ready', userId: user.id, productId: product.id, product, orderNumber: 'HM-READY-1', totalPrice: 2500, paymentType: 'CASH_ON_DELIVERY', paymentStatus: 'UNPAID', status: 'ORDERED', createdAt: new Date().toISOString() };
    order.id = 'order-ready';
    await page.addInitScript(() => localStorage.setItem('homemade-onboarding-v1', JSON.stringify({ state: { completed: true }, version: 0 })));
    await page.route('**/api/v1/**', async route => {
      const req = route.request();
      const path = new URL(req.url()).pathname.replace('/api/v1', '');
      if (path === '/auth/login') return route.fulfill({ json: { accessToken: 'test-token', expiresIn: 3600 } });
      if (path === '/auth/me') return route.fulfill({ json: user });
      if (path === '/products' && req.method() === 'GET') return route.fulfill({ json: [product, { ...product, id: 'sold-out', name: 'Hidden sold out', stock: 0 }, { ...product, id: 'custom', name: 'Hidden custom', productType: 'CUSTOM' }, { ...product, id: 'inactive', name: 'Hidden inactive', isActive: false }] });
      if (path === '/products/ready') { stockReads++; return route.fulfill({ json: product }); }
      if (path === '/orders' && req.method() === 'POST') {
        submissions++;
        expect(req.postDataJSON()).toEqual({ productId: 'ready', paymentType: 'CASH_ON_DELIVERY', customerNotes: 'Doorbell' });
        if (mode === 'uncertain') return route.abort();
        if (mode === 'stock') { product.stock = 0; return route.fulfill({ status: 409, json: { message: 'Insufficient stock' } }); }
        return route.fulfill({ status: 201, json: order });
      }
      if (path === '/orders/order-ready') return route.fulfill({ json: order });
      if (path === '/orders') return route.fulfill({ json: { data: submissions ? [order] : [], meta: { page: 1, totalPages: 1, total: submissions } } });
      throw new Error(`Unexpected request ${req.method()} ${path}`);
    });
    await page.goto('/login');
    await page.getByLabel('Email or username', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Order Ready bracelet', exact: true })).toBeVisible();
    await expect(page.getByText('Hidden custom')).toHaveCount(0);
    await expect(page.getByText('Hidden inactive')).toHaveCount(0);
    await expect(page.getByText('Hidden sold out')).toHaveCount(0);
    await page.getByRole('button', { name: 'Preview Ready bracelet image', exact: true }).click();
    await expect(page.getByTestId('product-image-preview')).toBeVisible();
    await expect(page).not.toHaveURL(/\/details/);
    await page.getByRole('button', { name: 'Close image preview', exact: true }).click();
    await expect(page.getByTestId('product-image-preview')).toHaveCount(0);
    await page.getByRole('button', { name: 'Order Ready bracelet', exact: true }).click();
    await expect(page.getByText('Color: Blue')).toBeVisible();
    await page.getByRole('button', { name: 'Order Now', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Design', exact: true })).toHaveCount(0);
    if (mode === 'profile') {
      await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Update my profile' })).toBeVisible();
      expect(submissions).toBe(0);
      return;
    }
    await page.getByLabel('Customer notes (optional)', { exact: true }).fill('Doorbell');
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    if (mode === 'success') {
      await expect(page.getByTestId('flow-toast')).toContainText('Order placed. Next, view your order');
      await expect(page.getByText('HM-READY-1')).toBeVisible();
      await expect(page.getByText('Your order has been placed.')).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
      if (mode === 'stock') {
        await expect(page.getByText('Out of stock', { exact: true })).toBeVisible();
        expect(stockReads).toBeGreaterThan(2);
      } else await expect(page.getByTestId('flow-toast').getByText(/We could not confirm whether your order was placed/)).toBeVisible();
    }
    expect(submissions).toBe(1);
  });
}
