import { expect, test } from '@playwright/test';

test.describe('session expirée', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Adresse courriel').fill('admin@lesaines.test');
    await page.getByLabel('Mot de passe').fill('Motdepasse123!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL('/backoffice');
  });

  test("le jeton d'accès est renouvelé sans que la personne le voie", async ({ page, context }) => {
    await context.clearCookies({ name: 'access_token' });
    await page.goto('/backoffice');
    await expect(page).toHaveURL('/backoffice');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonjour');
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).toContain('access_token');
  });

  test('sans jeton valide, retour à la connexion avec un message', async ({ page, context }) => {
    await context.clearCookies({ name: 'refresh_token' });
    await context.addCookies([
      { name: 'access_token', value: 'expired.eyJleHAiOjF9.mock', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/backoffice');
    await expect(page).toHaveURL(/\/login\?next=%2Fbackoffice&reason=expired/);
    await expect(page.getByText('Session expirée')).toBeVisible();
  });
});
