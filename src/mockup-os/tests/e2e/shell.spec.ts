import { expect, test } from '@playwright/test';

test('builder chrome loads and the overview renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/finch$/);
  await expect(page.getByText('Mockup OS')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Good afternoon/ })).toBeVisible();
});

test('pressing H hides the shell with zero layout residue', async ({ page }) => {
  await page.goto('/finch');
  await page.keyboard.press('h');
  // Shell chrome should be gone.
  await expect(page.getByText('Mockup OS')).toHaveCount(0);
  // Mockup content still present.
  await expect(page.getByRole('heading', { name: /Good afternoon/ })).toBeVisible();
});

test('journey: send money end-to-end', async ({ page }) => {
  await page.goto('/finch');
  await page.getByRole('link', { name: /Send money/ }).click();
  await expect(page).toHaveURL(/\/finch\/transfer$/);
  await page.getByRole('link', { name: /Review transfer/ }).click();
  await expect(page).toHaveURL(/\/finch\/transfer\/review$/);
  await page.getByRole('link', { name: /Send \$250/ }).click();
  await expect(page).toHaveURL(/\/finch\/transfer\/confirmed$/);
  await expect(page.getByRole('heading', { name: /on its way/ })).toBeVisible();
});
