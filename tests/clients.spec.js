import { test, expect } from '@playwright/test';

const playState = (page) =>
  page.locator('.carousel-track').evaluate((el) => getComputedStyle(el).animationPlayState);

test('la grille contient 20 clients', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#clients-grid li')).toHaveCount(20);
});

test('chaque client a un nom accessible', async ({ page }) => {
  await page.goto('/');
  const items = await page.locator('#clients-grid li').all();
  expect(items.length).toBe(20);
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
  await expect(page.locator('#clients-grid img[alt="ReachFive (acquis par Purse)"]:visible')).toBeVisible();
  await expect(page.locator('#clients-grid')).toContainText('ReachFive, acquis par Purse');
});

test('le carrousel se met en pause au survol', async ({ page }) => {
  await page.goto('/');
  expect(await playState(page)).toBe('running');
  await page.hover('#carousel');
  expect(await playState(page)).toBe('paused');
});

test('le carrousel se met en pause quand il reçoit le focus clavier', async ({ page }) => {
  await page.goto('/');
  await page.focus('#carousel a');
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
    await expect(page.locator('#clients-grid li')).toHaveCount(20);
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
      const img = page.locator(`#clients-grid img[alt="${alt}"]:visible`);
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

test('les logos ont un fond transparent, sans pastille', async ({ page }) => {
  for (const scheme of ['dark', 'light']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const bad = await page.$$eval('#clients img', (imgs) =>
      imgs.filter((i) => i.offsetParent !== null).filter((i) => {
        const s = getComputedStyle(i);
        return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.paddingLeft) > 0 || parseFloat(s.borderTopLeftRadius) > 0;
      }).map((i) => i.alt));
    expect(bad, scheme).toEqual([]);
  }
});

test('un logo sombre prend sa variante claire en thème sombre et reste normal en thème clair', async ({ page }) => {
  await page.goto('/');
  const src = (alt) => page.locator(`#clients-grid img[alt="${alt}"]:visible`).getAttribute('src');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await src('Accor'), 'dark').toContain('accor-dark.png');
  expect(await src('Renault Digital'), 'dark').toContain('renault-digital-dark.png');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  expect(await src('Accor'), 'light').toMatch(/accor\.svg$/);
  expect(await src('Renault Digital'), 'light').toMatch(/renault-digital\.svg$/);
});

test('sans choix de thème, la variante suit la préférence du système', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await page.locator('#clients-grid img[alt="Accor"]:visible').getAttribute('src')).toMatch(/accor\.svg$/);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await page.locator('#clients-grid img[alt="Accor"]:visible').getAttribute('src')).toContain('accor-dark.png');
});

test('le carrousel n\'a pas de bouton pause', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    await expect(page.locator('#carousel-pause'), path).toHaveCount(0);
    await expect(page.locator('#carousel button'), path).toHaveCount(0);
  }
});

test('BlaBlaCar et Garmin figurent dans la grille et le carrousel, avec leur logo', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    await page.waitForLoadState('load');
    for (const alt of ['BlaBlaCar', 'Garmin']) {
      for (const zone of ['#clients-grid', '#carousel']) {
        const img = page.locator(`${zone} img[alt="${alt}"]:visible`);
        await expect(img, `${path} ${zone} ${alt}`).toHaveCount(1);
        expect(await img.evaluate((i) => i.complete && i.naturalWidth > 0), `${path} ${zone} ${alt} chargé`).toBe(true);
      }
    }
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await page.locator('#clients-grid img[alt="BlaBlaCar"]:visible').getAttribute('src')).toContain('blablacar-dark.svg');
  expect(await page.locator('#clients-grid img[alt="Garmin"]:visible').getAttribute('src')).toContain('garmin-dark.svg');
});

for (const [width, cols] of [[1280, 4], [768, 4], [320, 2]]) {
  test(`la grille des références fait ${cols} colonnes à ${width} px${cols === 4 ? ' sur 5 lignes' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const { lefts, tops, overflow } = await page.$$eval('#clients-grid li', (lis) => ({
      lefts: [...new Set(lis.map((l) => Math.round(l.getBoundingClientRect().left)))].length,
      tops: [...new Set(lis.map((l) => Math.round(l.getBoundingClientRect().top)))].length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }));
    expect(lefts).toBe(cols);
    expect(tops).toBe(20 / cols);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
