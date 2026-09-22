import { expect, test } from '@playwright/test';

for (const mode of ['dark', 'light']) {
  test(
    'create, edit, save, order, and restore a handmade design in ' + mode + ' mode',
    async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');
      if (mode === 'light')
        await page.getByRole('button', { name: 'Switch to light mode' }).click();
      await expect(page.getByText('Small beads.')).toBeVisible();
      await page.screenshot({ path: 'test-results/home-' + mode + '-mobile.png', fullPage: true });
      await page.getByRole('button', { name: 'Create your own' }).click();
      await page.getByRole('button', { name: 'Create your design' }).click();
      await page.getByRole('button', { name: 'Add Honey Amber, €0.35' }).click();
      await page.getByRole('button', { name: 'Add Midnight Onyx, €0.40' }).click();
      await expect(page.getByText('€5.75', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(page.getByText('€5.35', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Redo', exact: true }).click();
      await expect(page.getByText('€5.75', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Select position 1, Honey Amber' }).click();
      await page.getByRole('button', { name: 'Replace with Ivory Pearl, €0.50' }).click();
      await expect(page.getByText('€5.90', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Move detail right' }).click();
      await expect(
        page.getByRole('button', { name: 'Select position 2, Ivory Pearl' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Remove selected detail' }).click();
      await expect(page.getByText('€5.40', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      for (let i = 0; i < 6; i++) {
        await page.getByRole('button', { name: 'Add Honey Amber, €0.35' }).click();
        await page.getByRole('button', { name: 'Add Midnight Onyx, €0.40' }).click();
        await page.getByRole('button', { name: 'Add Golden Glow, €0.60' }).click();
      }
      await expect(page.getByText('€14.00', { exact: true })).toBeVisible();
      await page.screenshot({
        path: 'test-results/designer-' + mode + '-mobile.png',
        fullPage: true,
      });
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      await page.getByLabel('Give your creation a name').fill('My Amber Story');
      await page.getByRole('button', { name: 'Save to My Designs' }).click();
      await expect(
        page.getByText('Your creation is safely tucked away in My Designs.'),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Continue to order' }).click();
      await page.getByRole('button', { name: 'Create an account' }).click();
      await page.getByLabel('First name', { exact: true }).fill('Mila');
      await page.getByLabel('Last name', { exact: true }).fill('Stone');
      await page.getByLabel('Email address', { exact: true }).fill('mila@example.com');
      await page.getByLabel('Home address', { exact: true }).fill('12 Amber Lane');
      await page.getByLabel('Password', { exact: true }).fill('prototype123');
      await page.getByLabel('Confirm password', { exact: true }).fill('prototype123');
      await page.getByRole('button', { name: 'Create my account' }).click();
      await page.getByRole('textbox', { name: 'City', exact: true }).fill('Warsaw');
      await page.getByRole('textbox', { name: 'Postal code', exact: true }).fill('00-001');
      await page.getByRole('textbox', { name: 'Country', exact: true }).fill('Poland');
      await expect(page.getByText('€16.00', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Place demo order' }).click();
      await expect(page.getByText(/Thank you for/)).toBeVisible();
      await page.getByRole('button', { name: 'View my orders' }).click();
      await expect(page.getByText('Pending', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText('My Amber Story', { exact: true })).toBeVisible();
      await expect(page.getByText('€16.00 · delivery included')).toBeVisible();
      await page.goto('/designs');
      await page.getByRole('button', { name: 'Duplicate My Amber Story', exact: true }).click();
      await expect(page.getByText('My Amber Story (copy)', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Delete My Amber Story (copy)', exact: true }).click();
      await expect(page.getByText('My Amber Story (copy)', { exact: true })).toHaveCount(0);
      await page.getByText('Undo', { exact: true }).click();
      await expect(page.getByText('My Amber Story (copy)', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText('My Amber Story (copy)', { exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    },
  );
}

test('search, filters, and empty states work on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByLabel('Search jewelry').fill('pearl');
  await expect(page.getByRole('button', { name: /Customize Pearl & Petal/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Customize Classic Bracelet/ })).toHaveCount(0);
  await page.goto('/designer');
  await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle bead filters' }).click();
  await page.getByRole('button', { name: 'Pink', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Pink Glass, €0.30' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Honey Amber, €0.35' })).toHaveCount(0);
  await page.getByText('Reset filters', { exact: true }).click();
  await page.getByRole('button', { name: 'Letters', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Letter Z, €0.80' })).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByText('Your bag is waiting.')).toBeVisible();
});
