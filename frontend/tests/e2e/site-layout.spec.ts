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
    await nav.getByRole('link', { name: 'Le Centre' }).click();
    await expect(page).toHaveURL('/a-propos');
  });
});
