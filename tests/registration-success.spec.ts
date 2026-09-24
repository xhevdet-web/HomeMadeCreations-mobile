import { expect, test } from '@playwright/test';

test('successful registration confirms the account and opens login', async ({ page }) => {
  await page.route('**/users', (route) => route.fulfill({ status: 201, json: {} }));
  await page.goto('/register');
  await page.getByLabel('First name').fill('Mila');
  await page.getByLabel('Last name').fill('Stone');
  await page.getByLabel('Email address').fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('secure-password-123');
  await page.getByLabel('Confirm password', { exact: true }).fill('secure-password-123');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('alert')).toContainText('Account created successfully. Please log in.');
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});
