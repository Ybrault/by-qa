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

test('GRTgaz s\'affiche avec son logo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#clients-grid img[alt="GRTgaz"]')).toHaveCount(1);
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
  for (const name of ['BNP Paribas', 'Bouygues Telecom', 'GRTgaz', 'Pierre & Vacances', 'France Médias Monde', 'ReachFive (acquis par Purse)']) {
    await expect(page.locator('#clients-grid').getByText(name, { exact: true })).toBeVisible();
  }
  await expect(page.locator('#clients-grid img')).toHaveCount(0);
});

test("L'Équipe, Altice Media, Kosc Telecom et Thomas Cook s'affichent avec leur logo", async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    await page.waitForLoadState('load');
    for (const alt of ["L'Équipe", 'Altice Media', 'Kosc Telecom', 'Thomas Cook']) {
      const img = page.locator(`#clients-grid img[alt="${alt}"]`);
      await expect(img, `${path} ${alt}`).toHaveCount(1);
      expect(await img.evaluate((i) => i.complete && i.naturalWidth > 0), `${path} ${alt} chargé`).toBe(true);
    }
    await expect(page.locator(`#carousel img[alt="L'Équipe"]`), `${path} carrousel`).toHaveCount(1);
  }
});

const LINKEDIN_EXP = 'https://www.linkedin.com/in/ybrault/details/experience/';

test('chaque logo renvoie vers les expériences LinkedIn dans un nouvel onglet', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    const rows = await page.$$eval('#clients img', (imgs) =>
      imgs.map((i) => {
        const a = i.closest('a');
        return { src: i.getAttribute('src'), href: a?.href, target: a?.target, rel: a?.rel, hiddenCopy: !!i.closest('[aria-hidden="true"]'), tabindex: a?.getAttribute('tabindex') };
      }),
    );
    expect(rows.length).toBeGreaterThanOrEqual(26);
    for (const r of rows) {
      expect(r.href, `${path} ${r.src}`).toBe(LINKEDIN_EXP);
      expect(r.target).toBe('_blank');
      expect(r.rel).toContain('noopener');
      if (r.hiddenCopy) expect(r.tabindex, `${path} copie du carrousel ${r.src}`).toBe('-1');
    }
  }
});

test('plus aucun nom de client en texte seul dans la grille, sauf la mention Purse', async ({ page }) => {
  await page.goto('/');
  const textOnly = await page.$$eval('#clients-grid li', (lis) =>
    lis.filter((li) => !li.querySelector('img')).map((li) => li.textContent.trim()));
  expect(textOnly).toEqual([]);
});
