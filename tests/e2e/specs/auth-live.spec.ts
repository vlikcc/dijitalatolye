import { test, expect } from '@playwright/test';

const LIVE = process.env.E2E_LIVE_API === 'true';

test.describe('Auth (live API)', () => {
  test.skip(!LIVE, 'E2E_LIVE_API not set');

  test('kayit ve giris akisi', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@meb.k12.tr`;
    const password = 'Test1234!Aa';

    await page.goto('/register');
    await page.getByLabel(/e-posta/i).fill(email);
    await page.getByLabel(/görünen ad|display/i).fill('E2E Teacher');
    await page.getByLabel(/şifre|sifre|password/i).first().fill(password);
    await page.getByRole('button', { name: /kayit ol|kayıt ol/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    await page.getByLabel(/e-posta/i).fill(email);
    await page.getByLabel(/şifre|sifre|password/i).fill(password);
    await page.getByRole('button', { name: /giriş yap|giris yap/i }).click();

    await expect(page.getByText(/çıkış/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
