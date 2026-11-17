import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { loginAs, openSidebarIfMobile } from './helpers';

test.describe('mise en page du back-office', () => {
  test("l'administration voit tout le menu, l'élément actif est marqué", async ({ page, isMobile }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL('/backoffice');
    await openSidebarIfMobile(page, isMobile);
    const nav = page.getByRole('navigation', { name: 'Back-office' });
    await expect(nav.getByRole('link', { name: 'Utilisateurs' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Contenu du site/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page');
    await expectNoA11yViolations(page);
  });

  test('les finances ne voient pas les liens réservés à l’administration', async ({ page, isMobile }) => {
    await loginAs(page, 'finance');
    await openSidebarIfMobile(page, isMobile);
    const nav = page.getByRole('navigation', { name: 'Back-office' });
    await expect(nav.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Utilisateurs' })).toHaveCount(0);
  });

  test('un membre est refusé (403)', async ({ page }) => {
    await loginAs(page, 'member', '/backoffice');
    await expect(page).toHaveURL('/forbidden');
  });
});
