import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady } from './helpers';

test.describe('mot de passe oublié', () => {
  test('le même message, que le courriel existe ou non', async ({ page }) => {
    for (const email of ['admin@lesaines.test', 'personne@inconnu.test']) {
      await gotoReady(page, '/forgot-password');
      await page.getByLabel('Adresse courriel').fill(email);
      await page.getByRole('button', { name: 'Recevoir le lien' }).click();
      await expect(page.getByText('Si un compte existe pour')).toBeVisible();
    }
    await expectNoA11yViolations(page);
  });

  test('les règles sont affichées et cochées pendant la saisie', async ({ page }) => {
    await gotoReady(page, '/reset-password?token=demo-reset-token');
    await page.getByLabel('Nouveau mot de passe').fill('Abcdefghijk1');
    await expect(page.getByRole('listitem').filter({ hasText: 'Au moins 12 caractères' })).toContainText('respectée');
    await page.getByLabel('Confirmer le mot de passe').fill('Abcdefghijk1');
    await page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click();
    await expect(page).toHaveURL('/login?reason=reset');
    await expect(page.getByText('Votre mot de passe a été modifié.')).toBeVisible();
  });

  test('un lien expiré propose d’en demander un nouveau', async ({ page }) => {
    await gotoReady(page, '/reset-password?token=perime');
    await page.getByLabel('Nouveau mot de passe').fill('Abcdefghijk1');
    await page.getByLabel('Confirmer le mot de passe').fill('Abcdefghijk1');
    await page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click();
    await expect(page.getByRole('link', { name: 'Demander un nouveau lien' })).toBeVisible();
  });
});
