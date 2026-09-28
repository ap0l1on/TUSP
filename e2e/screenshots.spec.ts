import { test, expect } from '@playwright/test';

const routes = ['#/', '#/yemek', '#/duyurular', '#/takvim', '#/geri-bildirim'];

test.describe('screenshots', () => {
  for (const r of routes) {
    test(`shot ${r}`, async ({ page }) => {
      await page.addInitScript(() => { try { localStorage.setItem('tusp.class', '9A'); localStorage.setItem('tusp.lang', 'tr'); } catch {} });
      await page.goto(`./${r}`);
      await page.waitForTimeout(1500);
      const name = r.replace('#/', 'today').replace('#', '').replace('/', '-') || 'today';
      await page.screenshot({ path: `screenshots/${name}-${page.viewportSize()?.width}.png`, fullPage: true });
      await expect(page.locator('#main')).toBeVisible();
    });
  }
  test('picker', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
    await page.goto('./#/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/picker-${page.viewportSize()?.width}.png`, fullPage: true });
    await expect(page.getByRole('heading', { name: 'Sınıfını seç' })).toBeVisible();
  });
});
