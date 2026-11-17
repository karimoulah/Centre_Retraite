import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs, openApplication, submitApplication } from './helpers';

test.describe('demandes d’adhésion (back-office)', () => {
  test('la liste montre les demandes en attente par défaut', async ({ page }) => {
    await loginAs(page, 'admin');
    await gotoReady(page, '/backoffice/memberships');
    const table = page.getByRole('table');
    await expect(table.getByText('En attente').first()).toBeVisible();
    await expect(table.getByText('Refusée')).toHaveCount(0);
    await expectNoA11yViolations(page);
  });

  test('refuser exige un motif, puis la demande est marquée refusée', async ({ page }) => {
    const lastName = await submitApplication(page);
    await loginAs(page, 'admin');
    await openApplication(page, lastName);
    await page.getByRole('button', { name: 'Refuser' }).click();
    const dialog = page.getByRole('alertdialog');
    const confirm = dialog.getByRole('button', { name: 'Refuser la demande' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Motif du refus').fill('Adresse hors du territoire desservi.');
    await confirm.click();
    await expect(page.getByText('Motif : Adresse hors du territoire desservi.')).toBeVisible();
  });

  test('approuver crée la fiche de membre ; une seconde décision est refusée (409)', async ({ page, browser }) => {
    const lastName = await submitApplication(page);
    await loginAs(page, 'admin');
    await openApplication(page, lastName);
    // A second administrator opens the same request at the same time.
    const other = await browser.newPage();
    await loginAs(other, 'admin');
    await openApplication(other, lastName);

    await page.getByRole('button', { name: 'Approuver' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Approuver' }).click();
    await expect(page.getByRole('link', { name: 'Voir la fiche de membre' })).toBeVisible();

    await other.getByRole('button', { name: 'Approuver' }).click();
    await other.getByRole('alertdialog').getByRole('button', { name: 'Approuver' }).click();
    await expect(other.getByRole('alertdialog')).toContainText('déjà été traitée');
    await other.close();
  });
});
