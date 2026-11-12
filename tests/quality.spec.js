import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', locale: 'fr_FR', url: 'https://by-qa.com/' },
  { path: '/en/', locale: 'en_US', url: 'https://by-qa.com/en/' },
];

function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

for (const p of PAGES) {
  test(`${p.path} a un titre, une description et une image de partage`, async ({ page }) => {
    await page.goto(p.path);
    expect((await page.title()).length).toBeGreaterThan(10);
    const meta = (sel) => page.locator(sel).getAttribute('content');
    expect((await meta('meta[name="description"]')).length).toBeGreaterThan(40);
    expect(await meta('meta[property="og:title"]')).toBeTruthy();
    expect(await meta('meta[property="og:description"]')).toBeTruthy();
    expect(await meta('meta[property="og:image"]')).toBe('https://by-qa.com/assets/img/og.png');
    expect(await meta('meta[property="og:locale"]')).toBe(p.locale);
    expect(await meta('meta[property="og:url"]')).toBe(p.url);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.url);
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
  });

  test(`${p.path} n'a aucun défilement horizontal à 320 px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(p.path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`${p.path} montre le focus clavier sur les liens et boutons`, async ({ page }) => {
    await page.goto(p.path);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const s = getComputedStyle(document.activeElement);
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThan(0);
    }
  });

  test(`${p.path} permet d'atteindre langue, thème et pause du carrousel au clavier`, async ({ page }) => {
    await page.goto(p.path);
    const seen = new Set();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      seen.add(await page.evaluate(() => document.activeElement.id));
    }
    for (const id of ['lang-switch', 'theme-toggle', 'carousel-pause']) expect(seen.has(id), id).toBe(true);
  });

  test(`${p.path} donne un texte alternatif à toutes les images`, async ({ page }) => {
    await page.goto(p.path);
    const missing = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.hasAttribute('alt')).length);
    expect(missing).toBe(0);
    const named = await page.$$eval('#clients-grid img', (imgs) => imgs.every((i) => i.alt.trim().length > 0));
    expect(named).toBe(true);
  });

  test(`${p.path} respecte le contraste AA dans les deux thèmes`, async ({ page }) => {
    await page.goto(p.path);
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      const v = await page.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        const g = (n) => s.getPropertyValue(n).trim();
        return { bg: g('--bg'), fg: g('--fg'), muted: g('--muted'), card: g('--card'), accent: g('--accent'), ink: g('--accent-ink'), field: g('--field-border') };
      });
      expect(ratio(v.fg, v.bg), `${theme} fg/bg`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v.muted, v.bg), `${theme} muted/bg`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v.muted, v.card), `${theme} muted/card`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v.accent, v.bg), `${theme} accent/bg`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v.ink, v.accent), `${theme} bouton`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v.field, v.bg), `${theme} bordure de champ/fond`).toBeGreaterThanOrEqual(3);
      expect(ratio(v.field, v.card), `${theme} bordure de champ/carte`).toBeGreaterThanOrEqual(3);
    }
  });

  test(`${p.path} ne produit aucune erreur console au chargement`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(p.path);
    await page.waitForLoadState('load');
    expect(errors).toEqual([]);
  });
}

test('favicon, og.png, robots.txt et sitemap.xml répondent 200', async ({ request }) => {
  for (const path of ['/assets/img/favicon.svg', '/assets/img/og.png', '/robots.txt', '/sitemap.xml']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('https://by-qa.com/en/');
});
