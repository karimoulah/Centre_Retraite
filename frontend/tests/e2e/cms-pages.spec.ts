import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

test.describe('pages du CMS', () => {
  test("l'accueil affiche les sections de la maquette", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bien entouré');
    await expect(page.getByRole('region', { name: 'Chiffres clés' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prochaines activités' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Un accompagnement à votre mesure' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nos activités phares' })).toBeVisible();
    await expect(page.getByText('Données de démonstration').first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('la liste de services montre l’aperçu de l’élément choisi', async ({ page, isMobile }) => {
    await page.goto('/');
    const item = page.getByRole('button', { name: 'Ateliers numériques' });
    await expect(async () => {
      await item.click();
      await expect(item).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.locator('#service-preview').getByRole('heading', { name: 'Ateliers numériques' })).toBeVisible();
    test.info().annotations.push({ type: 'viewport', description: isMobile ? 'mobile' : 'desktop' });
  });

  test('le carrousel passe à l’avis suivant', async ({ page }) => {
    await page.goto('/');
    const next = page.getByRole('button', { name: 'Avis suivant' });
    await expect(async () => {
      await next.click();
      await expect(page.getByText(/2 \/ \d/)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
  });

  test('une page de contenu a son titre et son SEO', async ({ page }) => {
    await page.goto('/qui-sommes-nous');
    await expect(page.getByRole('heading', { level: 1, name: 'Qui sommes-nous ?' })).toBeVisible();
    await expect(page).toHaveTitle(/Qui sommes-nous \? · Les Aînés/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Vision, mission et valeurs/);
    for (const anchor of ['vision', 'mission', 'valeurs']) await expect(page.locator(`#${anchor}`)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('/home renvoie vers /', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL('/');
  });

  test('une page non publiée renvoie 404', async ({ page }) => {
    const response = await page.goto('/brouillon-demo');
    expect(response?.status()).toBe(404);
  });
});

test.describe('pages des exigences', () => {
  test('témoignages et soutien sont accessibles', async ({ page }) => {
    for (const [path, title] of [['/temoignages', 'Témoignages des aînés'], ['/soutenir', 'Soutenir le Centre']]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expectNoA11yViolations(page);
    }
  });
});
