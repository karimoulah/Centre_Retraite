import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test.describe('utilisateurs (ADMIN)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('la liste se filtre et se trie par l’URL', async ({ page }) => {
    await page.goto('/backoffice/users?role=FINANCE');
    const table = page.getByRole('table');
    await expect(table.getByRole('link', { name: 'Marc Tremblay' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Robert Lavoie' })).toHaveCount(0);
    await expectNoA11yViolations(page);
  });

  test('inviter un utilisateur, puis modifier ses rôles et le désactiver', async ({ page }) => {
    const email = `nouveau+${Date.now()}@lesaines.test`;
    await gotoReady(page, '/backoffice/users/new');
    // On slow machines the streamed page can briefly contain the form twice: wait until it settles.
    await expect(page.locator('input[type="email"]')).toHaveCount(1, { timeout: 15_000 });
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Nadia');
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Benali');
    await page.getByLabel('Adresse courriel').fill(email);
    await page.getByRole('checkbox', { name: /Témoignages/ }).check();
    await page.getByRole('button', { name: 'Créer et envoyer l’invitation' }).click();
    await expect(page).toHaveURL(/\/backoffice\/users\/u-/);
    await expect(page.getByRole('heading', { level: 1, name: 'Nadia Benali' })).toBeVisible();
    await expect(page.getByText('Invitation envoyée').first()).toBeVisible();

    await page.getByRole('checkbox', { name: /Finances/ }).check();
    await page.getByRole('button', { name: 'Enregistrer les rôles' }).click();
    await expect(page.getByText('Rôles mis à jour.')).toBeVisible();

    await page.getByRole('button', { name: 'Désactiver le compte' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('ne pourra plus se connecter');
    await dialog.getByRole('button', { name: 'Désactiver' }).click();
    await expect(page.getByText('Désactivé').first()).toBeVisible();
  });

  test('un courriel déjà utilisé est signalé sous le champ', async ({ page }) => {
    await gotoReady(page, '/backoffice/users/new');
    // On slow machines the streamed page can briefly contain the form twice: wait until it settles.
    await expect(page.locator('input[type="email"]')).toHaveCount(1, { timeout: 15_000 });
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Double');
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Compte');
    await page.getByLabel('Adresse courriel').fill('finance@lesaines.test');
    await page.getByRole('checkbox', { name: /Finances/ }).check();
    await page.getByRole('button', { name: 'Créer et envoyer l’invitation' }).click();
    await expect(page.getByText('Un compte existe déjà avec ce courriel.').first()).toBeVisible();
  });

  test('on ne peut pas se retirer le rôle Administration', async ({ page }) => {
    await page.goto('/backoffice/users/u-admin');
    await expect(page.getByRole('checkbox', { name: /Administration/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Désactiver le compte' })).toHaveCount(0);
  });
});
