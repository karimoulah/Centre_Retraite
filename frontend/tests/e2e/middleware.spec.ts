import { expect, test } from '@playwright/test';

test.describe('middleware', () => {
  test('sans session, le back-office renvoie vers la connexion avec next', async ({ page }) => {
    await page.goto('/backoffice/users?page=2');
    await expect(page).toHaveURL(/\/login\?next=%2Fbackoffice%2Fusers%3Fpage%3D2/);
  });

  test('sans session, /account renvoie vers la connexion', async ({ page }) => {
    await page.goto('/account/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fprofile/);
  });

  test('les pages publiques restent accessibles', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });
});
