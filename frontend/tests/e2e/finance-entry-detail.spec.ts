import { expect, test, type Page } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

/** Creates a draft income through the form and returns its detail URL. */
async function newDraft(page: Page, description: string) {
  await gotoReady(page, '/backoffice/finance/entries/new');
  await page.getByLabel('Montant ($)').fill('80');
  await page.getByLabel('Catégorie').click();
  await page.getByRole('option', { name: 'Activités et sorties' }).click();
  await page.getByLabel('Mode de paiement').click();
  await page.getByRole('option', { name: 'Argent comptant' }).click();
  await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
  await page.waitForURL(/\/backoffice\/finance\/entries\/e-\d+$/, { timeout: 15_000 });
  await page.locator('html[data-hydrated="true"]').waitFor();
  return page.url();
}

test.describe('fiche d’une écriture', () => {
  test.beforeEach(async ({ page }) => loginAs(page, 'finance'));

  test('un brouillon se modifie puis se valide après confirmation ; il est ensuite figé', async ({
    page,
  }) => {
    await newDraft(page, `Billets ${Date.now()}`);
    await expect(page.getByRole('heading', { name: 'Modifier le brouillon' })).toBeVisible();
    await expectNoA11yViolations(page);
    await page
      .getByRole('region', { name: 'Modifier le brouillon' })
      .getByLabel('Montant ($)')
      .fill('85,25');
    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
    await expect(page.getByText(/85,25\s\$/).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Valider l’écriture' }).click();
    await expect(page.getByRole('alertdialog')).toContainText(
      'ne pourra plus être modifiée ni supprimée',
    );
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Valider définitivement' })
      .click();
    await expect(page.getByText('Écriture validée.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modifier le brouillon' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Supprimer le brouillon' })).toHaveCount(0);
    await expect(
      page.getByRole('region', { name: 'Historique' }).getByText('Validation'),
    ).toBeVisible();
  });

  test('la contrepassation exige un motif, affiche le montant opposé et ouvre l’écriture créée', async ({
    page,
  }) => {
    await newDraft(page, `Erreur ${Date.now()}`);
    await page.getByRole('button', { name: 'Valider l’écriture' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Valider définitivement' })
      .click();
    await expect(page.getByRole('button', { name: 'Contrepasser' })).toBeVisible();
    const original = page.url();

    await page.getByRole('button', { name: 'Contrepasser' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText(/-80,00\s\$|−80,00\s\$/);
    const confirm = dialog.getByRole('button', { name: 'Créer la contrepassation' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Motif de la contrepassation').fill('Montant saisi en double');
    await confirm.click();
    await expect(page.getByText('Contrepassation créée').first()).toBeVisible({ timeout: 15_000 });
    expect(page.url()).not.toBe(original);
    await expect(page.getByText('Montant saisi en double')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contrepasser' })).toHaveCount(0);

    await page.goto(original);
    await expect(page.getByText('Contrepassée par')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contrepasser' })).toHaveCount(0);
  });

  test('une dépense sans facture ne peut pas être validée ; la facture s’ajoute depuis la fiche', async ({
    page,
  }) => {
    await gotoReady(page, '/backoffice/finance/expenses/new');
    await page.getByLabel('Montant ($)').fill('18,50');
    await page.getByLabel('Catégorie').click();
    await page.getByRole('option', { name: 'Frais bancaires' }).click();
    await page.getByLabel('Mode de paiement').click();
    await page.getByRole('option', { name: 'Autre' }).click();
    await page.getByLabel('Fournisseur').fill('Desjardins');
    await page.getByLabel('Description').fill(`Frais ${Date.now()}`);
    await page.getByRole('button', { name: 'Enregistrer la dépense' }).click();
    await page.waitForURL(/\/backoffice\/finance\/entries\/e-\d+$/, { timeout: 15_000 });
    await page.locator('html[data-hydrated="true"]').waitFor();
    await expect(page.getByRole('button', { name: 'Valider l’écriture' })).toBeDisabled();
    await expect(
      page.getByText('Joignez la facture ou le reçu pour pouvoir valider cette dépense.'),
    ).toBeVisible();
    await page
      .getByLabel('Joindre une pièce')
      .setInputFiles({
        name: 'releve.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n%%EOF\n'),
      });
    await page.getByRole('button', { name: 'Envoyer la pièce' }).click();
    await expect(page.getByText('Pièce justificative jointe.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /releve\.pdf/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Valider l’écriture' })).toBeEnabled();
  });

  test('une dépense en attente renvoie vers l’approbation', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/entries?q=Biod%C3%B4me');
    await page.getByRole('table').getByRole('link').first().click();
    await expect(page.getByText('En attente d’approbation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Valider l’écriture' })).toHaveCount(0);
  });
});
