import { expect, test, type Page } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

/** A second finance person enters an expense above the threshold; returns its description. */
async function submittedByDirection(page: Page) {
  const description = `Traiteur ${Date.now()}`;
  await loginAs(page, 'direction');
  await gotoReady(page, '/backoffice/finance/expenses/new');
  await page.getByLabel('Montant ($)').fill('820');
  await page.getByLabel('Catégorie').click();
  await page.getByRole('option', { name: 'Activités et sorties' }).click();
  await page.getByLabel('Mode de paiement').click();
  await page.getByRole('option', { name: 'Chèque' }).click();
  await page.getByLabel('Fournisseur').fill('Traiteur du Marché');
  await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: 'Enregistrer la dépense' }).click();
  await page.waitForURL(/\/entries\/e-\d+$/, { timeout: 15_000 });
  await page.context().clearCookies();
  return description;
}

test.describe('approbation des dépenses et seuil', () => {
  test('les boutons sont désactivés pour l’auteur, actifs pour une autre personne', async ({
    page,
  }) => {
    const description = await submittedByDirection(page);
    await loginAs(page, 'direction');
    await gotoReady(page, '/backoffice/finance/expenses');
    const own = page.getByRole('row', { name: new RegExp(description) });
    await expect(own.getByRole('button', { name: 'Approuver' })).toBeDisabled();
    await expect(
      own.getByText('Vous avez saisi cette dépense : une autre personne doit l’approuver.'),
    ).toBeVisible();
    await expectNoA11yViolations(page);
    await page.context().clearCookies();
    await loginAs(page, 'finance');
    await gotoReady(page, '/backoffice/finance/expenses');
    await expect(
      page
        .getByRole('row', { name: new RegExp(description) })
        .getByRole('button', { name: 'Approuver' }),
    ).toBeEnabled();
  });

  test('une autre personne approuve ; le refus exige un motif', async ({ page }) => {
    const description = await submittedByDirection(page);
    await loginAs(page, 'finance');
    await gotoReady(page, '/backoffice/finance/expenses');
    const other = page.getByRole('row', { name: new RegExp(description) });
    await other.getByRole('button', { name: 'Refuser' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('button', { name: 'Refuser la dépense' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Annuler' }).click();
    await other.getByRole('button', { name: 'Approuver' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Approuver' }).click();
    await expect(
      page.getByText('Dépense approuvée : elle peut maintenant être validée.'),
    ).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(description) })).toHaveCount(0);
  });

  test('l’administration règle le seuil dans les paramètres', async ({ page }) => {
    await loginAs(page, 'admin');
    await gotoReady(page, '/backoffice/settings');
    const threshold = page.getByLabel('Seuil ($)');
    await expect(threshold).toHaveValue('500,00');
    await threshold.fill('-3');
    await page.getByRole('button', { name: 'Enregistrer le seuil' }).click();
    await expect(page.getByText('Entrez un montant en dollars, par exemple 500.')).toBeVisible();
    await threshold.fill('750');
    await page.getByRole('button', { name: 'Enregistrer le seuil' }).click();
    await expect(page.getByText('Seuil d’approbation enregistré.')).toBeVisible();
    await threshold.fill('500');
    await page.getByRole('button', { name: 'Enregistrer le seuil' }).click();
    await expect(page.getByText('Seuil d’approbation enregistré.').first()).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
