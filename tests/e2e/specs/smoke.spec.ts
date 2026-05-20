import { test, expect } from '@playwright/test';

const TIMESTAMP = Date.now();
const TEACHER_EMAIL = `teacher${TIMESTAMP}@meb.k12.tr`;
const TEACHER_PASSWORD = 'Test1234!';

test.describe('Vertical Slice Smoke', () => {
  test('anasayfa yuklenir', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Dijital Atol/i);
  });

  test('kayit ve giris akisi @requires-api', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/e-posta/i).fill(TEACHER_EMAIL);
    await page.getByLabel(/sifre|password/i).first().fill(TEACHER_PASSWORD);
    await page.getByRole('button', { name: /kayit ol|register/i }).click();

    await expect(page).toHaveURL(/\/(login|home|$|app)/, { timeout: 15_000 });

    await page.goto('/login');
    await page.getByLabel(/e-posta/i).fill(TEACHER_EMAIL);
    await page.getByLabel(/sifre|password/i).fill(TEACHER_PASSWORD);
    await page.getByRole('button', { name: /giris yap|login/i }).click();

    await expect(page.getByText(/cikis|logout|profil/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('kesif sayfasi listelenir', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByPlaceholder(/ara/i)).toBeVisible();
  });

  test('kvkk sayfasi (auth gerektirir)', async ({ page }) => {
    await page.goto('/kvkk');
    await expect(page).toHaveURL(/\/(login|kvkk)/);
  });
});
