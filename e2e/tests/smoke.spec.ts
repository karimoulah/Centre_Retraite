import { test, expect } from '@playwright/test';

test("la page d'accueil s'affiche", async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Centre d'accompagnement");
});

test("le lien d'évitement est atteignable au clavier", async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByText('Aller au contenu')).toBeFocused();
});
