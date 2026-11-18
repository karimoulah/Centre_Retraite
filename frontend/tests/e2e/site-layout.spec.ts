import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

test.describe('mise en page du portail', () => {
  test('en-tête, menu et pied de page viennent du CMS', async ({ page, isMobile }) => {
    await page.goto('/');
    const phone = page.getByRole('banner').getByRole('link', { name: /555-0100|Appeler le Centre/ });
    await expect(phone).toHaveAttribute('href', /^tel:/);
    if (!isMobile) {
      const nav = page.getByRole('navigation', { name: 'Navigation principale' });
      await expect(nav.getByRole('link', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page');
      for (const label of ['Qui sommes-nous ?', 'Témoignages des aînés', 'Soutenir / Faire un don', 'Devenir membre', 'Contact']) {
        await expect(nav.getByText(label, { exact: true })).toBeVisible();
      }
    }
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText('Téléphone')).toBeVisible();
    await expect(footer.getByRole('navigation', { name: 'Participer' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('le menu mobile se replie et se déplie', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Petit écran seulement');
    await page.goto('/');
    const open = page.getByRole('button', { name: 'Ouvrir le menu' });
    const nav = page.getByRole('navigation', { name: 'Navigation principale (mobile)' });
    await expect(async () => {
      if (!(await nav.isVisible())) await open.click();
      await expect(nav).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await nav.getByRole('link', { name: 'Mission' }).click();
    await expect(page).toHaveURL('/qui-sommes-nous#mission');
  });
});

test('les sous-menus mènent aux sections de la page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Menu déroulant du grand écran');
  await page.goto('/');
  await page.locator('html[data-hydrated="true"]').waitFor();
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await nav.getByRole('button', { name: 'Témoignages des aînés' }).click();
  await page.getByRole('menuitem', { name: 'Visionner' }).click();
  await expect(page).toHaveURL('/temoignages#visionner');
  await expect(page.locator('#visionner')).toBeInViewport();
});
