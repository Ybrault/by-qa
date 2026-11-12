import { test, expect } from '@playwright/test';

const ENDPOINT = '**/api.web3forms.com/submit';
const LINKEDIN = 'https://www.linkedin.com/in/ybrault/';

async function fill(page) {
  await page.fill('#contact-form [name=name]', 'Marie Test');
  await page.fill('#contact-form [name=email]', 'marie@example.org');
  await page.fill('#contact-form [name=message]', 'Bonjour, parlons de vos tests.');
}

test("l'envoi réussi affiche une confirmation et vide le formulaire", async ({ page }) => {
  await page.route(ENDPOINT, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }),
  );
  await page.goto('/');
  await fill(page);
  await page.click('#contact-form button[type=submit]');
  await expect(page.locator('#contact-status')).toContainText('Merci');
  await expect(page.locator('#contact-form [name=message]')).toHaveValue('');
});

test("l'échec réseau affiche une erreur et garde la saisie", async ({ page }) => {
  await page.route(ENDPOINT, (route) => route.abort());
  await page.goto('/');
  await fill(page);
  await page.click('#contact-form button[type=submit]');
  await expect(page.locator('#contact-status')).toContainText("n'a pas pu être envoyé");
  await expect(page.locator('#contact-form [name=message]')).toHaveValue(
    'Bonjour, parlons de vos tests.',
  );
});

test('le bouton est désactivé pendant l\'envoi', async ({ page }) => {
  await page.route(ENDPOINT, async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto('/');
  await fill(page);
  const button = page.locator('#contact-form button[type=submit]');
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toBeEnabled({ timeout: 10000 });
});

test("un second clic n'envoie pas deux requêtes", async ({ page }) => {
  let sent = 0;
  await page.route(ENDPOINT, async (route) => {
    sent += 1;
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto('/');
  await fill(page);
  const button = page.locator('#contact-form button[type=submit]');
  await button.click();
  await button.click({ force: true });
  await expect(page.locator('#contact-status')).toContainText('Merci', { timeout: 10000 });
  expect(sent).toBe(1);
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('le lien LinkedIn est présenté', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#contact .notice')).toBeVisible();
    await expect(page.locator('#contact .notice')).toContainText('nécessite JavaScript');
    await expect(page.locator('#contact-form')).toBeHidden();
    await expect(page.locator(`#contact a[href="${LINKEDIN}"]`).first()).toBeVisible();
  });
});

test('si contact.js ne se charge pas, le formulaire reste caché et LinkedIn est proposé', async ({ page }) => {
  await page.route('**/assets/js/contact.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#contact-form')).toBeHidden();
  await expect(page.locator('#contact .notice')).toBeVisible();
});

test("aucune adresse e-mail dans la page ni dans les scripts", async ({ request }) => {
  const emailPattern = /[\w.+-]+@[\w-]+\.\w+/;
  for (const path of ['/', '/assets/js/theme.js', '/assets/js/carousel.js', '/assets/js/contact.js']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(await res.text(), path).not.toMatch(emailPattern);
  }
});
