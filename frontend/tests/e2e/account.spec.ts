import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test.describe('espace membre', () => {
  test.beforeEach(async ({ page }) => loginAs(page, 'member'));

  test('le membre arrive sur son profil et modifie seulement ses coordonnées', async ({ page }) => {
    await expect(page).toHaveURL('/account/profile');
    await gotoReady(page, '/account/profile');
    await expect(page.getByText('M-0001')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Courriel/ })).toHaveCount(0);
    await page.getByLabel('Téléphone').fill('');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Le téléphone est obligatoire.')).toBeVisible();
    await page.getByLabel('Téléphone').fill('514 555-0143');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Vos coordonnées sont enregistrées.')).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('les consentements montrent leur date et un avertissement avant le retrait de la diffusion', async ({ page }) => {
    await gotoReady(page, '/account/consents');
    const publication = page.getByRole('switch', { name: 'Diffusion de mes témoignages' });
    await expect(publication).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/Accord donné le/).first()).toBeVisible();
    await expectNoA11yViolations(page);

    await publication.click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('seront retirés du site');
    await dialog.getByRole('button', { name: 'Garder mon accord' }).click();
    await expect(publication).toHaveAttribute('aria-checked', 'true');

    const newsletter = page.getByRole('switch', { name: 'Nouvelles et calendrier' });
    const before = await newsletter.getAttribute('aria-checked');
    await newsletter.click();
    await expect(page.getByText(/Votre (accord|retrait) est enregistré\./)).toBeVisible();
    await newsletter.click();
    await expect(newsletter).toHaveAttribute('aria-checked', before ?? 'false');
  });

  test("l'équipe sans rôle membre n'a pas d'espace membre", async ({ browser }) => {
    const page = await browser.newPage();
    await loginAs(page, 'finance');
    await page.goto('/account/profile');
    await expect(page).toHaveURL('/forbidden');
    await page.close();
  });
});
