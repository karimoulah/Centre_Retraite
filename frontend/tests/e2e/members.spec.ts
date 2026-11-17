import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test.describe('membres (back-office)', () => {
  test.beforeEach(async ({ page }) => loginAs(page, 'admin'));

  test('la liste est paginée et filtrable', async ({ page }) => {
    await gotoReady(page, '/backoffice/members?pageSize=10');
    await expect(page.getByText(/^1 à 10 sur \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Page suivante' }).click();
    await expect(page).toHaveURL(/page=2/);
    await gotoReady(page, '/backoffice/members?ageCategory=85_PLUS');
    await expect(page.getByRole('table').getByText('65 à 74 ans')).toHaveCount(0);
    await expectNoA11yViolations(page);
  });

  test('la fiche se modifie et montre les consentements', async ({ page }) => {
    await gotoReady(page, '/backoffice/members/m-3');
    await expect(page.getByRole('heading', { name: 'Consentements' })).toBeVisible();
    const phone = page.getByLabel('Téléphone');
    await phone.fill('438 555-0177');
    await page.getByRole('button', { name: 'Enregistrer la fiche' }).click();
    await expect(page.getByText('Fiche du membre enregistrée.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Téléphone')).toHaveValue('438 555-0177');
  });

  test('la désactivation est confirmée', async ({ page }) => {
    await gotoReady(page, '/backoffice/members?q=Fortin');
    await page.getByRole('table').getByRole('link').first().click();
    await page.getByRole('button', { name: 'Désactiver le membre' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('son espace membre sera fermé');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
});
