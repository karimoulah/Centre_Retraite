import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

test.describe('accueil', () => {
  test("s'affiche sans violation d'accessibilité", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/Les Aînés/);
    await expectNoA11yViolations(page);
  });

  test("le lien d'évitement est le premier élément au clavier", async ({ page, isMobile }) => {
    test.skip(isMobile, 'Clavier physique seulement');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
  });
});

test.describe("pages d'erreur", () => {
  test('une adresse inconnue renvoie une page 404 en français', async ({ page }) => {
    const response = await page.goto('/cette-page-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('la page 403 explique le refus', async ({ page }) => {
    await page.goto('/forbidden');
    await expect(page.getByRole('heading', { name: 'Accès refusé' })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
