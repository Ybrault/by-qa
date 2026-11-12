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
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
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
