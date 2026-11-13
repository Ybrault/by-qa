import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/mentions-legales.html', home: '/', lang: 'fr', h1: 'Mentions légales', switchHref: 'en/legal-notice.html', capital: '1 000 €', canonical: 'https://by-qa.com/mentions-legales.html', footerHref: 'mentions-legales.html' },
  { path: '/en/legal-notice.html', home: '/en/', lang: 'en', h1: 'Legal notice', switchHref: '../mentions-legales.html', capital: '€1,000', canonical: 'https://by-qa.com/en/legal-notice.html', footerHref: 'legal-notice.html' },
];

for (const p of PAGES) {
  test(`${p.path} donne l'identité légale de la société`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
    await expect(page.locator('h1')).toHaveText(p.h1);
    const text = await page.locator('main').innerText();
    for (const needle of ['BY-QA', '819 453 523', 'Nanterre', p.capital, 'Yoann Brault', 'GitHub', 'Web3Forms']) {
      expect(text, `${p.path} contient ${needle}`).toContain(needle);
    }
  });

  test(`${p.path} n'affiche ni adresse postale ni e-mail`, async ({ page }) => {
    await page.goto(p.path);
    const html = await page.content();
    for (const banned of ['Garches', 'Grande Rue', '92380', 'live.fr']) expect(html, banned).not.toContain(banned);
    expect(await page.locator('a[href^="mailto:"]').count()).toBe(0);
    expect(html).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  });

  test(`${p.path} renvoie vers l'autre langue, l'accueil et partage le thème`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('#lang-switch')).toHaveAttribute('href', p.switchHref);
    await expect(page.locator('a.brand')).toHaveAttribute('href', './');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  });

  test(`${p.path} déclare son URL canonique et ses alternatives de langue`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.canonical);
    const alts = await page.$$eval('link[rel="alternate"][hreflang]', (els) => Object.fromEntries(els.map((e) => [e.getAttribute('hreflang'), e.getAttribute('href')])));
    expect(alts).toEqual({ fr: 'https://by-qa.com/mentions-legales.html', en: 'https://by-qa.com/en/legal-notice.html' });
  });

  test(`${p.path} ne produit aucune erreur et n'a pas de défilement horizontal à 320 px`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(p.path);
    await page.waitForLoadState('load');
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test(`la page d'accueil ${p.home} a un lien « mentions légales » dans son pied de page`, async ({ page }) => {
    await page.goto(p.home);
    await expect(page.locator(`footer a[href="${p.footerHref}"]`)).toHaveCount(1);
    await page.click(`footer a[href="${p.footerHref}"]`);
    await expect(page.locator('h1')).toHaveText(p.h1);
  });
}

test('le sitemap liste les deux pages légales', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('https://by-qa.com/mentions-legales.html');
  expect(sitemap).toContain('https://by-qa.com/en/legal-notice.html');
});
