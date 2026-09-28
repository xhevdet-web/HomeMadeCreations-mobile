import { expect, test } from '@playwright/test';

test('toasts appear on button clicks, fade away, and preserve inline errors', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('homemade-onboarding-v1', JSON.stringify({ state: { completed: true }, version: 0 })));
  await page.route('**/api/v1/auth/login', route => route.fulfill({ status: 401, json: {} }));
  await page.goto('/login');
  const notification = page.getByTestId('flow-toast');
  await expect(notification).toHaveCount(0);
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(notification).toContainText('Please enter your email or username.');
  await expect(notification).toHaveCSS('opacity', '1');
  await expect(notification).toHaveCount(0, { timeout: 6500 });
  await expect(page.getByRole('alert')).toContainText('Please enter your email or username.');
  await page.getByLabel('Email or username', { exact: true }).fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(notification).toContainText('incorrect');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(notification).toHaveCount(0);
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await expect(page).toHaveURL(/\/login$/);
});
