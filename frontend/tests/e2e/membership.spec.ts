import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';
import { gotoReady } from './helpers';

test.describe('adhésion (portail)', () => {
  test('le formulaire est accessible et explique la date de naissance', async ({ page }) => {
    await gotoReady(page, '/membership');
    await expect(page.getByText('Elle n’est jamais affichée publiquement.', { exact: false })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('les champs obligatoires manquants sont signalés', async ({ page }) => {
    await gotoReady(page, '/membership');
    await page.getByRole('button', { name: 'Envoyer ma demande d’adhésion' }).click();
    await expect(page.getByText('Le prénom est obligatoire.')).toBeVisible();
    await expect(page.getByText('Choisissez Masculin ou Féminin.')).toBeVisible();
    await expect(page.getByText('Le téléphone est obligatoire.')).toBeVisible();
    await expect(page.getByText('L’adresse postale est obligatoire.')).toBeVisible();
    await expect(page.getByText('La date de naissance est obligatoire.')).toBeVisible();
    await expect(page.getByText('Choisissez votre catégorie d’âge.')).toBeVisible();
  });

  test('une demande complète mène à la confirmation', async ({ page }) => {
    await gotoReady(page, '/membership');
    await page.getByLabel('Prénom').fill('Jeanne');
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill(`Essai${Date.now()}`);
    await page.getByLabel('Adresse courriel').fill(`jeanne+${Date.now()}@example.org`);
    const sex = page.getByRole('group', { name: /Sexe/ });
    await expect(sex.getByRole('radio')).toHaveCount(2);
    await sex.getByRole('radio', { name: 'Féminin' }).check();
    await page.getByLabel('Téléphone').fill('514 555-0142');
    await page.getByLabel('Adresse postale').fill('45, rue Fleury Est, Montréal');
    await page.getByRole('radio', { name: '75 à 84 ans' }).check();
    await page.locator('input[type="date"]').fill('1950-05-20');
    await page.getByRole('checkbox', { name: /vœux d’anniversaire/ }).check();
    await page.getByRole('button', { name: 'Envoyer ma demande d’adhésion' }).click();
    await expect(page).toHaveURL(/\/membership\/confirmation\?status=PENDING/);
    await expect(page.getByRole('heading', { name: 'Merci, votre demande est reçue' })).toBeVisible();
  });

  test('une adresse déjà membre est signalée sous le champ', async ({ page }) => {
    await gotoReady(page, '/membership');
    await page.getByLabel('Prénom').fill('Robert');
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Lavoie');
    await page.getByLabel('Adresse courriel').fill('membre@lesaines.test');
    await page.getByLabel('Téléphone').fill('514 555-0142');
    await page.getByLabel('Adresse postale').fill('123, rue Exemple, Montréal');
    await page.locator('input[type="date"]').fill('1948-03-12');
    await page.getByRole('radio', { name: 'Masculin' }).check();
    await page.getByRole('radio', { name: '75 à 84 ans' }).check();
    await page.getByRole('button', { name: 'Envoyer ma demande d’adhésion' }).click();
    await expect(page.getByText('Cette adresse est déjà celle d’un membre. Connectez-vous à votre espace.')).toBeVisible();
  });
});
