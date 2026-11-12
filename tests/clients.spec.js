import { test, expect } from '@playwright/test';

const playState = (page) =>
  page.locator('.carousel-track').evaluate((el) => getComputedStyle(el).animationPlayState);

test('la grille contient 18 clients', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#clients-grid li')).toHaveCount(18);
});

test('chaque client a un nom accessible', async ({ page }) => {
  await page.goto('/');
  const items = await page.locator('#clients-grid li').all();
  expect(items.length).toBe(18);
  for (const li of items) {
    const img = li.locator('img');
    const alt = (await img.count()) ? await img.first().getAttribute('alt') : null;
    const text = (await li.innerText()).trim();
    expect((alt && alt.trim()) || text).toBeTruthy();
  }
});

test('aucun logo de la grille ni du carrousel n\'est cassé', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  const { total, broken } = await page.$$eval('#clients img', (imgs) => ({
    total: imgs.length,
    broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
  }));
  expect(total).toBeGreaterThanOrEqual(13);
  expect(broken).toEqual([]);
});

test('GRTgaz mentionne Natran', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#clients-grid img[alt="GRTgaz (Natran)"]')).toHaveCount(1);
});

test('ReachFive affiche le logo Purse et la mention acquis par Purse', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#clients-grid img[alt="ReachFive (acquis par Purse)"]')).toBeVisible();
  await expect(page.locator('#clients-grid')).toContainText('ReachFive, acquis par Purse');
});

test('le carrousel se met en pause au survol', async ({ page }) => {
  await page.goto('/');
  expect(await playState(page)).toBe('running');
  await page.hover('#carousel');
  expect(await playState(page)).toBe('paused');
});

test('le bouton pause arrête le carrousel', async ({ page }) => {
  await page.goto('/');
  await page.click('#carousel-pause');
  await expect(page.locator('#carousel-pause')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(0, 0);
  expect(await playState(page)).toBe('paused');
});

test('le carrousel se met en pause quand il reçoit le focus clavier', async ({ page }) => {
  await page.goto('/');
  await page.focus('#carousel-pause');
  expect(await playState(page)).toBe('paused');
});

test.describe('mouvement réduit', () => {
  test.use({ reducedMotion: 'reduce' });
  test('le carrousel ne défile pas avec prefers-reduced-motion', async ({ page }) => {
    await page.goto('/');
    const name = await page
      .locator('.carousel-track')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe('none');
  });
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('la grille reste visible sans JavaScript', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#clients-grid li').first()).toBeVisible();
    await expect(page.locator('#clients-grid li')).toHaveCount(18);
  });
});

test('si les logos ne chargent pas, chaque nom reste lisible dans la grille', async ({ page }) => {
  await page.route('**/assets/logos/**', (route) => route.abort());
  await page.goto('/');
  await page.waitForLoadState('load');
  for (const name of ['BNP Paribas', 'Bouygues Telecom', 'GRTgaz (Natran)', 'Pierre & Vacances', 'France Médias Monde', 'ReachFive (acquis par Purse)']) {
    await expect(page.locator('#clients-grid').getByText(name, { exact: true })).toBeVisible();
  }
  await expect(page.locator('#clients-grid img')).toHaveCount(0);
});
