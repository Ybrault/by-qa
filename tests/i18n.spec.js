import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'dark' });

const SHARED =['#clients', '#expertise', '#contact', '#clients-grid', '#carousel', '#carousel-pause', '#contact-form', '#contact-status', '#theme-toggle', '#lang-switch'];

test('la page française déclare lang fr et la page anglaise lang en', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test("chaque page pointe vers l'autre via #lang-switch", async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#lang-switch')).toHaveAttribute('href', 'en/');
  await expect(page.locator('#lang-switch')).toHaveAttribute('hreflang', 'en');
  await page.goto('/en/');
  await expect(page.locator('#lang-switch')).toHaveAttribute('href', '../');
  await expect(page.locator('#lang-switch')).toHaveAttribute('hreflang', 'fr');
});

test('les deux pages ont les mêmes sections', async ({ page }) => {
  const counts = [];
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    for (const sel of SHARED) await expect(page.locator(sel), `${path} ${sel}`).toHaveCount(1);
    counts.push(await page.locator('main > section').count());
    await expect(page.locator('#clients-grid li')).toHaveCount(18);
  }
  expect(counts[0]).toBe(counts[1]);
});

test('la page anglaise affiche le bon titre et le bon bouton', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('h1')).toHaveText('Craftsman of Quality.');
  await expect(page.locator('a.cta').first()).toHaveText("Let's discuss your project");
  await expect(page.locator('#clients-grid')).toContainText('ReachFive, acquired by Purse');
  await expect(page.locator('#clients-grid img[alt="ReachFive (acquired by Purse)"]')).toBeVisible();
});

test('les ressources de la page anglaise se chargent', async ({ page }) => {
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto('/en/');
  await page.waitForLoadState('load');
  expect(bad).toEqual([]);
});

test('les deux pages portent les balises hreflang', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    const links = await page.$$eval('link[rel="alternate"][hreflang]', (els) =>
      Object.fromEntries(els.map((e) => [e.getAttribute('hreflang'), e.getAttribute('href')])),
    );
    expect(links, path).toEqual({
      fr: 'https://by-qa.com/',
      en: 'https://by-qa.com/en/',
      'x-default': 'https://by-qa.com/',
    });
  }
});

test('le choix du thème est partagé entre les langues', async ({ page }) => {
  await page.goto('/');
  await page.click('#theme-toggle');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('la page anglaise affiche ses messages en anglais', async ({ page }) => {
  await page.route('**/api.web3forms.com/submit', (route) => route.abort());
  await page.goto('/en/');
  await page.fill('#contact-form [name=name]', 'Mary Test');
  await page.fill('#contact-form [name=email]', 'mary@example.org');
  await page.fill('#contact-form [name=message]', 'Hello');
  await page.click('#contact-form button[type=submit]');
  await expect(page.locator('#contact-status')).toContainText('could not be sent');
  await page.click('#carousel-pause');
  await expect(page.locator('#carousel-pause')).toHaveText('Play');
});

test('les textes français restent en français', async ({ page }) => {
  await page.goto('/');
  await page.click('#carousel-pause');
  await expect(page.locator('#carousel-pause')).toHaveText('Lecture');
});

test('chaque page informe que le formulaire passe par Web3Forms', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#contact-form .privacy')).toContainText('Web3Forms');
  await page.goto('/en/');
  await expect(page.locator('#contact-form .privacy')).toContainText('Web3Forms');
});

test('les liens internes fonctionnent depuis un sous-dossier de publication', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h === '/' || h.startsWith('/en'))).toEqual([]);
  await page.goto('/en/');
  const hrefsEn = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  expect(hrefsEn.filter((h) => h === '/' || h.startsWith('/en'))).toEqual([]);
});
