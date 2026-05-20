import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000/api';

test.describe('Vertical slice flow', () => {
  test.beforeAll(async ({ request }) => {
    try {
      const resp = await request.get(`${API_BASE.replace('/api', '')}/health`, { timeout: 3000 });
      if (!resp.ok()) test.skip(true, 'API unavailable');
    } catch {
      test.skip(true, 'API unavailable');
    }
  });

  test('discover → content detail → play', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByPlaceholder(/ara/i)).toBeVisible();

    const firstLink = page.locator('a[href*="/contents/"]').first();
    if (await firstLink.count() === 0) {
      test.skip(true, 'No published content in discover');
      return;
    }

    await firstLink.click();
    await expect(page.locator('h1')).toBeVisible();

    const playLink = page.getByRole('link', { name: /oyna/i });
    if (await playLink.count() > 0) {
      await playLink.click();
      await expect(page.locator('iframe[title="play"]')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('rating endpoint reachable when authenticated', async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_TOKEN, 'E2E_AUTH_TOKEN not set');

    const token = process.env.E2E_AUTH_TOKEN!;
    const discover = await request.get(`${API_BASE}/search/contents?q=matematik&pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!discover.ok()) {
      test.skip(true, 'Search API unavailable');
      return;
    }

    const body = await discover.json() as { items?: { id: string }[] };
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
