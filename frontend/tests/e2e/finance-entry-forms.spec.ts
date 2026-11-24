import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

const pick = async (page: import('@playwright/test').Page, label: string, option: string) => {
  await page.getByLabel(label).click();
  await page.getByRole('option', { name: option }).click();
};

test.describe('saisie d’une recette et d’une dépense', () => {
  test.beforeEach(async ({ page }) => loginAs(page, 'finance'));

  test('une recette en dollars est envoyée en cents, avec un contributeur trouvé par recherche', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/entries/new');
    await expectNoA11yViolations(page);
    await page.getByLabel('Montant ($)').fill('125,50');
    await pick(page, 'Catégorie', 'Cotisations des membres');
    await pick(page, 'Mode de paiement', 'Chèque');
    await page.getByLabel('Rechercher un contributeur').fill('Lavoie');
    await page.getByRole('list', { name: 'Contributeurs trouvés' }).getByRole('button', { name: /Robert Lavoie/ }).click();
    const description = `Cotisation ${Date.now()}`;
    await page.getByLabel('Description').fill(description);
    await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
    await expect(page.getByText('Recette enregistrée comme brouillon.')).toBeVisible();
    await gotoReady(page, `/backoffice/finance/entries?q=${encodeURIComponent(description)}`);
    await expect(page.getByRole('table').getByText(/125,50\s\$/)).toBeVisible();
  });

  test('seules les catégories du bon sens sont proposées, et le montant est vérifié', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/entries/new');
    await page.getByLabel('Catégorie').click();
    await expect(page.getByRole('option', { name: 'Loyer et charges' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Bingo (ancien)' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByLabel('Montant ($)').fill('12,345');
    await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
    await expect(page.getByText('Entrez un montant en dollars, par exemple 125,50.')).toBeVisible();
  });

  test('un contributeur se crée sans quitter le formulaire', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/entries/new');
    await page.getByRole('button', { name: 'Créer un contributeur' }).click();
    const name = `Donatrice ${Date.now()}`;
    await page.getByRole('dialog').getByLabel('Nom').fill(name);
    await page.getByRole('dialog').getByRole('button', { name: 'Créer le contributeur' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText('Entrez le montant.')).toHaveCount(0);
  });

  test('une dépense au-delà du seuil part en approbation, avec sa facture envoyée et une barre de progression', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/expenses/new');
    await expect(page.getByText(/Au-delà de 500,00\s\$/)).toBeVisible();
    await page.getByLabel('Montant ($)').fill('640');
    await pick(page, 'Catégorie', 'Activités et sorties');
    await pick(page, 'Mode de paiement', 'Carte');
    await page.getByLabel('Fournisseur').fill('Autobus Laval');
    await page.getByLabel('Description').fill('Sortie au Jardin botanique');
    await page.getByLabel('Pièce justificative').setInputFiles({ name: 'facture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.getByRole('button', { name: 'Enregistrer la dépense' }).click();
    await expect(page.getByText('Dépense enregistrée : elle attend l’approbation d’une autre personne.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Ajoutez la pièce depuis la fiche/)).toHaveCount(0);
  });

  test('un fichier non accepté est refusé avant l’envoi', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/expenses/new');
    await page.getByLabel('Pièce justificative').setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(page.getByText('Formats acceptés : PDF, JPG ou PNG.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enregistrer la dépense' })).toBeDisabled();
  });
});
