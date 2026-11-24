import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test.describe('catégories et contributeurs (finances)', () => {
  test.beforeEach(async ({ page }) => loginAs(page, 'finance'));

  test('les catégories sont séparées en recettes et dépenses, et se désactivent sans suppression', async ({
    page,
  }) => {
    await gotoReady(page, '/backoffice/finance/categories');
    await expect(page.getByRole('tab', { name: /Recettes/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const income = page.getByRole('region', { name: 'Catégories de recettes' });
    await expect(income.getByRole('cell', { name: /Dons.*dons en ligne/ })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.getByRole('tab', { name: /Dépenses/ }).click();
    const expenses = page.getByRole('region', { name: 'Catégories de dépenses' });
    await expect(
      expenses.getByRole('columnheader', { name: 'Admissible au reçu fiscal' }),
    ).toHaveCount(0);
    const name = `Taxis ${Date.now()}`;
    await expenses.getByRole('button', { name: 'Nouvelle catégorie de dépense' }).click();
    await page.getByRole('dialog').getByLabel('Nom').fill(name);
    await page.getByRole('dialog').getByRole('button', { name: 'Créer la catégorie' }).click();
    await expect(page.getByText('Catégorie créée.')).toBeVisible();
    const row = expenses.getByRole('row', { name: new RegExp(name) });
    await row.getByRole('button', { name: 'Désactiver' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('jamais supprimée');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Désactiver' }).click();
    await expect(row.getByText('Désactivée')).toBeVisible();
  });

  test('un nom déjà pris dans le même sens est refusé', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/categories');
    await page.getByRole('button', { name: 'Nouvelle catégorie de recette' }).click();
    await page.getByRole('dialog').getByLabel('Nom').fill('Subventions');
    await page.getByRole('dialog').getByRole('button', { name: 'Créer la catégorie' }).click();
    await expect(
      page.getByRole('dialog').getByText('Une catégorie porte déjà ce nom dans ce sens.').first(),
    ).toBeVisible();
  });

  test('un contributeur se crée, se retrouve et se modifie', async ({ page }) => {
    const name = `Fondation Essai ${Date.now()}`;
    await gotoReady(page, '/backoffice/finance/contributors/new');
    await page.getByRole('radio', { name: 'Organisme' }).check();
    await page.getByLabel('Nom').fill(name);
    await page.getByLabel('Adresse courriel').fill(`fondation${Date.now()}@exemple.org`);
    await page.getByRole('button', { name: 'Créer le contributeur' }).click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await page.getByLabel('Téléphone').fill('514 555-0123');
    await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
    await expect(page.getByText('Fiche du contributeur enregistrée.')).toBeVisible();

    await gotoReady(page, `/backoffice/finance/contributors?q=${encodeURIComponent(name)}`);
    await expect(page.getByRole('table').getByRole('link', { name })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('ces pages sont réservées aux finances', async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, 'testimonials');
    await page.goto('/backoffice/finance/categories');
    await expect(page).toHaveURL(/\/forbidden/);
  });
});
