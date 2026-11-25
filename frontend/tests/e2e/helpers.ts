import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'Motdepasse123!';

export const accounts = {
  admin: 'admin@lesaines.test',
  finance: 'finance@lesaines.test',
  testimonials: 'temoignages@lesaines.test',
  member: 'membre@lesaines.test',
  /** ADMIN + FINANCE: a second finance person, for the four-eyes rule. */
  direction: 'direction@lesaines.test',
} as const;

/** Logs in through the real form and waits for the redirect. */
export async function loginAs(page: Page, account: keyof typeof accounts, next?: string) {
  await gotoReady(page, next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel('Adresse courriel').fill(accounts[account]);
  await page.getByLabel('Mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).not.toHaveURL(/\/login/);
  // The Payload console (/admin) has its own layout, without the hydration marker.
  if (!next?.startsWith('/admin'))
    await page.locator('html[data-hydrated="true"]').waitFor({ timeout: 30_000 });
}

/** Opens the back-office sidebar on small screens (retries until hydration is done). */
export async function openSidebarIfMobile(page: Page, isMobile: boolean) {
  if (!isMobile) return;
  const nav = page.getByRole('navigation', { name: 'Back-office' });
  await expect(async () => {
    if (!(await nav.isVisible()))
      await page.getByRole('button', { name: 'Afficher ou masquer le menu' }).first().click();
    await expect(nav).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/** Navigates and waits until React is interactive (see HydrationMarker). */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.locator('html[data-hydrated="true"]').waitFor({ timeout: 30_000 });
}

/** Submits a membership application through the public form; returns the unique last name used. */
export async function submitApplication(page: Page) {
  const lastName = `Essai${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await gotoReady(page, '/membership');
  await page.getByLabel('Prénom').fill('Simone');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill(lastName);
  await page.getByLabel('Adresse courriel').fill(`${lastName.toLowerCase()}@example.org`);
  await page.getByRole('radio', { name: 'Féminin' }).check();
  await page.getByLabel('Téléphone').fill('514 555-0199');
  await page.getByLabel('Adresse postale').fill('12, rue des Érables, Montréal');
  await page.getByRole('radio', { name: '65 à 74 ans' }).check();
  await page.locator('input[type="date"]').fill('1956-08-30');
  await page.getByRole('button', { name: 'Envoyer ma demande d’adhésion' }).click();
  await expect(page).toHaveURL(/\/membership\/confirmation/);
  return lastName;
}

/** Opens the back-office detail page of the application made by `lastName`. */
export async function openApplication(page: Page, lastName: string) {
  await gotoReady(page, `/backoffice/memberships?q=${lastName}`);
  await page.getByRole('link', { name: `Simone ${lastName}` }).click();
  await expect(page.getByRole('heading', { level: 1, name: `Simone ${lastName}` })).toBeVisible();
}
