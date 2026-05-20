import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000/api';
const LIVE = process.env.E2E_LIVE_API === 'true';
const EXPECT_SLUG = process.env.E2E_EXPECT_SLUG ?? 'e2e-demo-matematik';

test.describe('Vertical slice flow', () => {
  test.beforeAll(async ({ request }) => {
    if (!LIVE) {
      try {
        const resp = await request.get(`${API_BASE.replace('/api', '')}/health/live`, { timeout: 3000 });
        if (!resp.ok()) test.skip(true, 'API unavailable');
      } catch {
        test.skip(true, 'API unavailable');
      }
      return;
    }

    const ready = await request.get('http://localhost:5001/health/ready', { timeout: 5000 });
    if (!ready.ok()) test.skip(true, 'Identity not ready');
  });

  test('discover → content detail → play', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByPlaceholder(/ara/i)).toBeVisible();

    if (LIVE) {
      const seeded = page.locator(`a[href*="/contents/${EXPECT_SLUG}"]`).first();
      await expect(seeded).toBeVisible({ timeout: 15_000 });
      await seeded.click();
      await expect(page.locator('h1')).toContainText(/E2E Demo/i);
      return;
    }

    const firstLink = page.locator('a[href*="/contents/"]').first();
    if ((await firstLink.count()) === 0) {
      test.skip(true, 'No published content in discover');
      return;
    }

    await firstLink.click();
    await expect(page.locator('h1')).toBeVisible();

    const playLink = page.getByRole('link', { name: /oyna/i });
    if ((await playLink.count()) > 0) {
      await playLink.click();
      await expect(page.locator('iframe[title="play"]')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('rating endpoint reachable when authenticated', async ({ request }) => {
    const token = process.env.E2E_AUTH_TOKEN;
    test.skip(!token, 'E2E_AUTH_TOKEN not set');

    const discover = await request.get(`${API_BASE}/search/contents?q=matematik&pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!discover.ok()) {
      test.skip(true, 'Search API unavailable');
      return;
    }

    const body = (await discover.json()) as { items?: { id: string }[] };
    const contentId = body.items?.[0]?.id;
    if (!contentId) {
      test.skip(true, 'No content for rating test');
      return;
    }

    const rating = await request.get(`${API_BASE}/contents/${contentId}/rating`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(rating.ok()).toBeTruthy();
  });
});
