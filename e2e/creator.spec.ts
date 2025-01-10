import { test, expect } from '@playwright/test';

test.describe('test creator interface', () => {
  test('check UI', async ({ page }) => {
    await page.goto('/create');
    await expect(
      page.getByTestId('config-file-importer'),
      'should have config loader '
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Create' }),
      'should have creator link'
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Play' }),
      'should have creator link'
    ).toBeVisible();
  });
});
