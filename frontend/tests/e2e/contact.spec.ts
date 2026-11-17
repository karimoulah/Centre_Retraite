import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

test.describe('contact', () => {
  test('la page est accessible et montre les coordonnées', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1, name: 'Nous joindre' })).toBeVisible();
    await expect(page.getByRole('complementary').getByRole('link', { name: /555-0100/ })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('les erreurs apparaissent sous chaque champ', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Votre nom est obligatoire.')).toBeVisible();
    await expect(page.getByText('Votre message doit contenir au moins 10 caractères.')).toBeVisible();
  });

  test("l'envoi affiche une confirmation", async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Votre nom').fill('Hélène Martin');
    await page.getByLabel('Adresse courriel').fill(`helene+${Date.now()}@example.org`);
    await page.getByLabel('Votre message').fill('Bonjour, quelles sont les activités de décembre ?');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByRole('heading', { name: 'Merci, votre message est envoyé' })).toBeVisible();
  });

  test("une erreur de l'API sur un champ s'affiche sous ce champ", async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Votre nom').fill('Test');
    await page.getByLabel('Adresse courriel').fill('personne@invalide.test');
    await page.getByLabel('Votre message').fill('Message de test assez long.');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Cette adresse ne peut pas recevoir de courriel.')).toBeVisible();
  });
});

test('au-delà de 3 messages par minute, un message explique la limite', async ({ page }) => {
  const email = `pressee+${Date.now()}@example.org`;
  await page.goto('/contact');
  for (let i = 0; i < 4; i++) {
    if (i > 0) await page.getByRole('button', { name: 'Écrire un autre message' }).click();
    await page.getByLabel('Votre nom').fill('Personne pressée');
    await page.getByLabel('Adresse courriel').fill(email);
    await page.getByLabel('Votre message').fill(`Message numéro ${i + 1}, assez long.`);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    if (i < 3) await expect(page.getByRole('heading', { name: 'Merci, votre message est envoyé' })).toBeVisible();
  }
  await expect(page.getByText('plusieurs messages en peu de temps')).toBeVisible();
});
