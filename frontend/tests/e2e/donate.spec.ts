import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady } from './helpers';

test.describe('don en ligne', () => {
  test('montants suggérés en pilules, montant libre vérifié, retour sur la page de remerciement', async ({ page }) => {
    await gotoReady(page, '/donate');
    await expect(page.getByRole('heading', { level: 1, name: 'Faire un don' })).toBeVisible();
    const amounts = page.getByRole('radiogroup', { name: 'Montant de votre don' });
    await expect(amounts.getByRole('radio', { name: /^50\s\$$/ })).toBeChecked();
    await expect(page.getByText('Le Centre ne voit ni ne conserve jamais vos données de carte.', { exact: false })).toBeVisible();
    await expectNoA11yViolations(page);

    await amounts.getByText('Autre montant').click();
    await page.getByLabel('Autre montant ($)').fill('3');
    await page.getByLabel('Nom').fill('Huguette Simard');
    await page.getByLabel('Adresse courriel').fill('huguette@exemple.org');
    await page.getByRole('button', { name: 'Continuer vers le paiement sécurisé' }).click();
    await expect(page.getByText('Le don minimum est de 5 $.')).toBeVisible();

    await page.getByLabel('Autre montant ($)').fill('40');
    await page.getByRole('button', { name: 'Continuer vers le paiement sécurisé' }).click();
    await expect(page).toHaveURL(/\/donate\/thank-you\?session_id=/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Merci pour votre don !' })).toBeVisible();
    await expect(page.getByText(/40,00\s\$/)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('un paiement encore en attente est expliqué', async ({ page }) => {
    await gotoReady(page, '/donate');
    await page.getByLabel('Nom').fill('Virement en attente');
    await page.getByLabel('Adresse courriel').fill('virement@exemple.org');
    await page.getByRole('button', { name: 'Continuer vers le paiement sécurisé' }).click();
    await expect(page.getByRole('heading', { name: /en cours de confirmation/ })).toBeVisible({ timeout: 15_000 });
  });

  test('la page d’annulation rassure et propose de recommencer', async ({ page }) => {
    await gotoReady(page, '/donate/cancelled');
    await expect(page.getByText('Aucun montant n’a été prélevé.', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Recommencer mon don' }).click();
    await expect(page).toHaveURL(/\/donate$/);
    await expectNoA11yViolations(page);
  });
});
