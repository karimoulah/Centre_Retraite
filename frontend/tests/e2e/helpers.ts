import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'Motdepasse123!';

export const accounts = {
  admin: 'admin@lesaines.test',
  finance: 'finance@lesaines.test',
  testimonials: 'temoignages@lesaines.test',
  member: 'membre@lesaines.test',
} as const;

/** Logs in through the real form and waits for the redirect. */
export async function loginAs(page: Page, account: keyof typeof accounts, next?: string) {
  await gotoReady(page, next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel('Adresse courriel').fill(accounts[account]);
  await page.getByLabel('Mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Opens the back-office sidebar on small screens (retries until hydration is done). */
export async function openSidebarIfMobile(page: Page, isMobile: boolean) {
  if (!isMobile) return;
  const nav = page.getByRole('navigation', { name: 'Back-office' });
  await expect(async () => {
    if (!(await nav.isVisible())) await page.getByRole('button', { name: 'Afficher ou masquer le menu' }).first().click();
    await expect(nav).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/** Navigates and waits until React is interactive (see HydrationMarker). */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.locator('html[data-hydrated="true"]').waitFor({ timeout: 30_000 });
}
