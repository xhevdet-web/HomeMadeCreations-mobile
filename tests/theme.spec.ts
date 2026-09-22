import { expect, test } from '@playwright/test';

test('theme toggle updates mounted screens, preserves input, and survives reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Search jewelry').fill('pearl');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.getByTestId('screen')).toHaveCSS('background-color', 'rgb(250, 247, 242)');
  await expect(page.getByLabel('Search jewelry')).toHaveValue('pearl');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  await expect(page.getByTestId('screen')).toHaveCSS('background-color', 'rgb(250, 247, 242)');
  for (const route of [
    '/details?id=bracelet-pearl',
    '/designer',
    '/preview',
    '/checkout',
    '/designs',
    '/orders',
    '/profile',
    '/register',
    '/login',
  ]) {
    await page.goto(route);
    await expect(page.getByTestId('screen')).toHaveCSS('background-color', 'rgb(250, 247, 242)');
  }
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 740 });
  const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
  const bag = page.getByRole('button', { name: 'Open shopping bag' });
  const toggleBounds = await toggle.boundingBox();
  const bagBounds = await bag.boundingBox();
  expect(toggleBounds).not.toBeNull();
  expect(bagBounds).not.toBeNull();
  expect(toggleBounds!.x + toggleBounds!.width).toBeLessThanOrEqual(320);
  expect(toggleBounds!.x).toBeGreaterThanOrEqual(bagBounds!.x + bagBounds!.width);
  await toggle.click();
  await expect(page.getByTestId('screen')).toHaveCSS('background-color', 'rgb(16, 17, 15)');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await expect(page.getByTestId('screen')).toHaveCSS('background-color', 'rgb(16, 17, 15)');
});
