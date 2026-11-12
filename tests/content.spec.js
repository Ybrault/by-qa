import { test, expect } from '@playwright/test';

test("l'en-tête affiche le titre et l'appel à l'action", async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Craftsman of Quality.');
  const cta = page.locator('a.cta').first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveText('Discutons de votre projet');
  await expect(cta).toHaveAttribute('href', '#contact');
});

test('les chiffres autorisés apparaissent', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  expect(text).toContain('20 ans');
  expect(text).toContain('10 ans');
  expect(text).toContain('avril 2016');
});

test("aucun faux chiffre de test n'est affiché", async ({ page, request }) => {
  const html = await (await request.get('/')).text();
  expect(html).not.toContain('142');
  expect(html).not.toContain('passed ·');
  await page.goto('/');
  await expect(page.locator('.terminal')).toContainText('✓ all tests passed');
});

test('les sections attendues existent', async ({ page }) => {
  await page.goto('/');
  for (const id of ['expertise', 'methode', 'parcours']) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }
});
