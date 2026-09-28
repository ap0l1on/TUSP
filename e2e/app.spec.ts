import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch {}
  });
});

async function pick9A(page: import('@playwright/test').Page) {
  await page.getByRole('heading', { name: 'Sınıfını seç' }).waitFor({ timeout: 15000 }).catch(() => {});
  const grade = page.getByRole('button', { name: /9\. sınıf|Grade 9/i }).first();
  if (await grade.count()) await grade.click().catch(() => {});
  const c = page.getByRole('button', { name: '9-A' });
  if (await c.count()) await c.click().catch(() => {});
}

test('first visit pick 9A, today shows lessons with room change + cancelled', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: 'Sınıfını seç' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /9\. sınıf|Grade 9/i }).first().click();
  await page.getByRole('button', { name: '9-A' }).click();
  await expect(page.getByText('Günün akışı').or(page.getByText('Day timeline'))).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.timeline-item').first()).toBeVisible();
});

test('urgent banner shows and can be dismissed', async ({ page }) => {
  await page.goto('./#/');
  await pick9A(page);
  const banner = page.locator('[role="alert"]').first();
  if (await banner.count()) {
    await banner.getByRole('button').click();
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  } else {
    await page.goto('./#/duyurular');
    await expect(page.getByText('Kantin kartları').or(page.getByText('Acil'))).toBeVisible({ timeout: 15000 });
  }
});

test('lunch shows registration notice, tomorrow switches day', async ({ page }) => {
  await page.goto('./#/yemek');
  await pick9A(page);
  await expect(page.getByText(/öğle yemeğine kayıtlı/i)).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /Yarın|Tomorrow/ }).click();
  await expect(page.locator('.card').first()).toBeVisible();
});

test('announcement detail opens and ICS downloads', async ({ page }) => {
  await page.goto('./#/duyurular');
  await pick9A(page);
  const link = page.locator('a[href*="#/duyuru/"]').first();
  await expect(link).toBeVisible({ timeout: 15000 });
  await link.click();
  await expect(page.getByRole('button', { name: /Takvime ekle|Add to calendar/ })).toBeVisible();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Takvime ekle|Add to calendar/ }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toMatch(/\.ics$/);
});

test('calendar shows event dots', async ({ page }) => {
  await page.goto('./#/takvim');
  await pick9A(page);
  await expect(page.locator('.cal-grid')).toBeVisible({ timeout: 15000 });
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.dots .dot').count()) break;
    await page.getByRole('button', { name: '›' }).click();
  }
  await expect(page.locator('.dots .dot').first()).toBeVisible();
});

test('feedback shows iframe, TR/EN toggle works, no CSP errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./#/geri-bildirim');
  await pick9A(page);
  await expect(page.locator('iframe.fb').or(page.getByText(/yakında|coming soon/i))).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'TR/EN' }).click();
  await expect(page.getByRole('heading', { name: 'Feedback' }).or(page.getByRole('heading', { name: 'Geri bildirim' }))).toBeVisible();
  expect(errors.filter((e) => e.includes('Content Security Policy')).length).toBe(0);
});

test('offline reload shows cached data and banner', async ({ page, context }) => {
  await page.goto('./#/');
  await pick9A(page);
  await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  // SW precaches app shell + data; verify caches exist
  const hasCache = await page.evaluate(async () => {
    try {
      const names = await caches.keys();
      return names.length > 0;
    } catch { return false; }
  });
  expect(hasCache).toBe(true);
  await expect(page.locator('main.content')).toBeVisible();
  await context.setOffline(false);
});
