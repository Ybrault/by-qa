import { test, expect } from '@playwright/test';

const DARK_BG = 'rgb(13, 17, 23)';
const LIGHT_BG = 'rgb(255, 255, 255)';

test.describe('thème sombre par défaut', () => {
  test.use({ colorScheme: 'dark' });

  test('le thème est sombre par défaut', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe(DARK_BG);
  });

  test('le bouton bascule le thème et mémorise le choix', async ({ page }) => {
    await page.goto('/');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('appareil réglé en clair', () => {
  test.use({ colorScheme: 'light', javaScriptEnabled: false });

  test('le thème suit le réglage clair de l\'appareil sans JavaScript', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe(LIGHT_BG);
  });
});

const LABELS = { '/': { light: 'Mode clair', dark: 'Mode sombre' }, '/en/': { light: 'Light mode', dark: 'Dark mode' } };

for (const path of ['/', '/en/']) {
  test.describe(`libellé du bouton de thème ${path}`, () => {
    test.use({ colorScheme: 'dark' });

    test('le bouton annonce le thème vers lequel il bascule', async ({ page }) => {
      await page.goto(path);
      const btn = page.locator('#theme-toggle');
      await expect(btn).toHaveText(LABELS[path].light);
      await page.click('#theme-toggle');
      await expect(btn).toHaveText(LABELS[path].dark);
      await page.click('#theme-toggle');
      await expect(btn).toHaveText(LABELS[path].light);
    });

    test('le libellé suit le thème mémorisé après rechargement', async ({ page }) => {
      await page.goto(path);
      await page.click('#theme-toggle');
      await page.reload();
      await expect(page.locator('#theme-toggle')).toHaveText(LABELS[path].dark);
    });
  });

  test.describe(`libellé du bouton, appareil clair ${path}`, () => {
    test.use({ colorScheme: 'light' });
    test('sans choix mémorisé, le bouton propose le mode sombre', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('#theme-toggle')).toHaveText(LABELS[path].dark);
    });
  });
}
