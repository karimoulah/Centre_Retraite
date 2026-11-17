import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

test.describe('aperçu des brouillons et console CMS', () => {
  test("l'administration voit un brouillon avec le bandeau « Aperçu »", async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/preview?slug=brouillon-demo');
    await expect(page).toHaveURL('/brouillon-demo');
    await expect(page.getByText('Aperçu : vous voyez la dernière version')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Brouillon de démonstration' })).toBeVisible();
    await page.getByRole('link', { name: 'Quitter l’aperçu' }).click();
    await expect(page.getByText('Aperçu : vous voyez la dernière version')).toHaveCount(0);
  });

  test("l'aperçu est refusé sans le rôle ADMIN", async ({ page }) => {
    await loginAs(page, 'finance');
    await page.goto('/preview?slug=brouillon-demo');
    await expect(page).toHaveURL('/forbidden');
  });

  test('sans session, la console CMS renvoie vers la connexion', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test("l'administration ouvre la console CMS sans second mot de passe", async ({ page }) => {
    await loginAs(page, 'admin', '/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/Pages/).first()).toBeVisible({ timeout: 30_000 });
  });
});
