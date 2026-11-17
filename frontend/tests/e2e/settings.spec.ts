import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady, loginAs } from './helpers';

test('l’interrupteur d’approbation automatique s’explique et s’enregistre', async ({ page }) => {
  await loginAs(page, 'admin');
  await gotoReady(page, '/backoffice/settings');
  const toggle = page.getByRole('switch', { name: 'Approbation automatique des adhésions' });
  await expect(page.getByText('les demandes attendent la décision')).toBeVisible();
  await expectNoA11yViolations(page);
  const before = await toggle.getAttribute('aria-checked');
  await toggle.click();
  await expect(page.getByText(/Approbation automatique (activée|désactivée)\./)).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', before ?? 'false');
});
