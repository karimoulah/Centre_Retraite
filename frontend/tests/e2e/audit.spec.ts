import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test.describe("journal d'audit", () => {
  test('montre les actions récentes avec avant / après lisible', async ({ page }) => {
    await loginAs(page, 'admin');
    await gotoReady(page, '/backoffice/audit?q=Bouchard');
    const row = page.getByRole('row').filter({ hasText: 'Rôles modifiés' }).first();
    await expect(row).toBeVisible();
    await row.getByText(/champ/).click();
    await expect(row.getByRole('cell', { name: 'Administration, Finances' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('se filtre par type d’élément et par période', async ({ page }) => {
    await loginAs(page, 'admin');
    await gotoReady(page, '/backoffice/audit?entityType=MembershipRequest');
    await expect(page.getByRole('table').getByText('Rôles modifiés')).toHaveCount(0);
    await gotoReady(page, '/backoffice/audit?period=custom&from=2000-01-01&to=2000-01-31');
    await expect(page.getByText('Aucune entrée')).toBeVisible();
  });

  test('une modification faite au back-office y apparaît', async ({ page }) => {
    await loginAs(page, 'admin');
    await gotoReady(page, '/backoffice/settings');
    const toggle = page.getByRole('switch', { name: 'Approbation automatique des adhésions' });
    await toggle.click();
    await expect(page.getByText(/Approbation automatique (activée|désactivée)\./)).toBeVisible();
    await toggle.click();
    await expect(page.getByText(/Approbation automatique (activée|désactivée)\./).first()).toBeVisible();
    await gotoReady(page, '/backoffice/audit?entityType=Settings');
    await expect(page.getByRole('table').getByText('Paramètre modifié').first()).toBeVisible();
  });
});
