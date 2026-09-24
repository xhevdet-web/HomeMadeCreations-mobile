import { expect, test } from '@playwright/test';

test('reorder a placed bead and add one after scrolling the catalog', async ({ page }) => {
  await page.route('**/auth/login', (route) => route.fulfill({ json: {
    accessToken: 'access-test', refreshToken: 'refresh-test', expiresIn: 3600,
  } }));
  await page.route('**/auth/me', (route) => route.fulfill({ json: {
    id: 'test-user', firstName: 'Mila', lastName: 'Stone', email: 'mila@example.com',
  } }));
  await page.goto('/login');
  await page.getByLabel('Email or username').fill('mila@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('tab', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Select a category' }).click();
  await page.getByRole('button', { name: 'Select Bracelets' }).click();

  await page.getByRole('button', { name: /Add Honey Amber/ }).click();
  await page.getByRole('button', { name: /Add Midnight Onyx/ }).click();
  const jewelry = page.getByLabel('bracelet with 2 components');
  const jewelryBounds = await jewelry.boundingBox();
  expect(jewelryBounds).not.toBeNull();
  const centerX = jewelryBounds!.x + jewelryBounds!.width / 2;
  await page.mouse.move(centerX, jewelryBounds!.y + jewelryBounds!.height * 52 / 320);
  await page.mouse.down();
  await page.waitForTimeout(250);
  await page.mouse.move(jewelryBounds!.x + jewelryBounds!.width * 271 / 320,
    jewelryBounds!.y + jewelryBounds!.height * 148 / 320, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('homemade-draft-v1');
    const draft = raw ? JSON.parse(raw) : null;
    return draft?.state?.items?.find((entry: { itemId: string }) => entry.itemId === 'amber')?.angle;
  })).toBeGreaterThan(0.2);
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('homemade-draft-v1');
    const draft = raw ? JSON.parse(raw) : null;
    return draft?.state?.items?.find((entry: { itemId: string }) => entry.itemId === 'amber')?.angle;
  })).toBeLessThan(0.3);
  const finishSelecting = page.getByRole('button', { name: 'Finish selecting' });
  if (await finishSelecting.isVisible()) await finishSelecting.click();

  const lastBead = page.getByRole('button', { name: /Add Letter Z/ });
  await lastBead.scrollIntoViewIfNeeded();
  const source = await lastBead.boundingBox();
  const target = await jewelry.boundingBox();
  expect(source).not.toBeNull();
  expect(target).not.toBeNull();
  expect(target!.y).toBeLessThan(source!.y);
  await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByLabel('bracelet with 3 components')).toBeVisible();
});
