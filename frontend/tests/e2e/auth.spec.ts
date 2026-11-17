import { expect, test, type Page } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

const PASSWORD = 'Motdepasse123!';

async function login(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel('Adresse courriel').fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

test.describe('connexion', () => {
  test('la page est accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('les champs vides affichent une erreur sous chaque champ', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Entrez votre adresse courriel.')).toBeVisible();
    await expect(page.getByText('Entrez votre mot de passe.')).toBeVisible();
  });

  test('un mauvais mot de passe affiche un message générique', async ({ page }) => {
    await page.goto('/login');
    await login(page, 'inconnu@lesaines.test', 'mauvais');
    await expect(page.getByRole('alert').filter({ hasText: /./ })).toContainText('Courriel ou mot de passe incorrect.');
  });

  test('un compte bloqué affiche un message dédié', async ({ page }) => {
    await page.goto('/login');
    await login(page, 'bloque@lesaines.test');
    await expect(page.getByRole('alert').filter({ hasText: /./ })).toContainText('temporairement bloqué');
  });

  test("l'équipe arrive au back-office et revient à la page demandée", async ({ page }) => {
    await page.goto('/backoffice');
    await expect(page).toHaveURL(/\/login\?next=%2Fbackoffice/);
    await login(page, 'admin@lesaines.test');
    await expect(page).toHaveURL('/backoffice');
  });

  test('un next externe est ignoré', async ({ page }) => {
    await page.goto('/login?next=//evil.example.com');
    await login(page, 'admin@lesaines.test');
    await expect(page).toHaveURL('/backoffice');
  });
});

test.describe('déconnexion', () => {
  test("ramène à l'accueil et efface la session", async ({ page, context }) => {
    await page.goto('/login');
    await login(page, 'finance@lesaines.test');
    await expect(page).toHaveURL('/backoffice');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL('/');
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).not.toContain('access_token');
    await page.goto('/backoffice');
    await expect(page).toHaveURL(/\/login/);
  });
});
