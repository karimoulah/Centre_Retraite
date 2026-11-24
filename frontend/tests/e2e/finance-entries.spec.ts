import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test.describe('liste des écritures', () => {
  test.beforeEach(async ({ page }) => loginAs(page, 'finance'));

  test('les totaux de la sélection sont au-dessus du tableau, montants à droite', async ({
    page,
  }) => {
    await gotoReady(page, '/backoffice/finance/entries');
    const totals = page.getByRole('region', { name: 'Totaux de la sélection' });
    await expect(totals.getByText('Recettes')).toBeVisible();
    await expect(totals.getByText('Solde')).toBeVisible();
    const amount = page.getByRole('table').getByRole('cell').filter({ hasText: /\$/ }).first();
    await expect(amount.locator('span')).toHaveClass(/text-right/);
    await expectNoA11yViolations(page);
  });

  test('les filtres changent la sélection et ses totaux', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/entries?direction=EXPENSE&status=SUBMITTED');
    const totals = page.getByRole('region', { name: 'Totaux de la sélection' });
    await expect(totals.getByText('0,00 $').first()).toBeVisible();
    await expect(page.getByRole('table').getByText('À approuver').first()).toBeVisible();
    await expect(page.getByRole('table').getByText('Validée')).toHaveCount(0);
    await gotoReady(page, '/backoffice/finance/entries?q=Contrepassation');
    await expect(page.getByRole('table').getByText(/−30,00|-30,00/)).toBeVisible();
  });

  test('la fiche d’un contributeur liste ses dons', async ({ page }) => {
    await gotoReady(page, '/backoffice/finance/contributors/k-caisse');
    await expect(page.getByRole('heading', { name: 'Dons et recettes' })).toBeVisible();
    await expect(
      page
        .getByRole('table')
        .last()
        .getByText(/500,00/)
        .first(),
    ).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
