import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const shots = ".impeccable/review/login-premium/after";
test.beforeAll(() => mkdir(shots, { recursive: true }));

test("failed covers fall back to available games without blocking sign-in", async ({
  page,
}) => {
  await page.goto("/giris");
  const coverUrls = await page
    .locator(".login-game-cover")
    .evaluateAll((images) =>
      images.map((img) => (img as HTMLImageElement).src),
    );
  const secondTitle = await page
    .getByRole("group", { name: "Oyun kapaklarını keşfet" })
    .getByRole("button")
    .nth(1)
    .getAttribute("aria-label");
  await page.route(coverUrls[0], (route) => route.abort());
  await page.reload();
  await expect(page.locator(".login-game-cover")).toHaveCount(
    coverUrls.length - 1,
  );
  await expect(page.locator(".login-game-caption h3")).toHaveText(
    secondTitle!.replace(" kapağını göster", ""),
  );
  for (const url of coverUrls) await page.route(url, (route) => route.abort());
  await page.reload();
  await expect(
    page.locator(".account-form-panel .button-primary"),
  ).toBeEnabled();
  await expect(page.locator(".login-game-showcase")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Her oyunda yeni bir keşif." }),
  ).toBeVisible();
  await page.screenshot({
    path: `${shots}/no-artwork.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("manual cover selection preserves the login draft and keyboard focus", async ({
  page,
}) => {
  await page.goto("/giris?next=%2Fogretmen%2Fyeni");
  const panel = page.locator(".account-form-panel");
  const identifier = panel.getByLabel("E-posta veya kullanıcı adı");
  const password = panel.getByLabel("Parola", { exact: true });
  await identifier.fill("ogretmen@example.test");
  await password.fill("test-parolasi-123");
  const choices = page.getByRole("group", { name: "Oyun kapaklarını keşfet" });
  const second = choices.getByRole("button").nth(1);
  await second.focus();
  await second.press("Enter");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(second).toBeFocused();
  await expect(page.locator(".login-game-caption h3")).toHaveText(
    "Sözcük Eşleri",
  );
  await expect(identifier).toHaveValue("ogretmen@example.test");
  await expect(password).toHaveValue("test-parolasi-123");
  await expect(
    panel.getByRole("link", { name: "Hesap oluştur" }),
  ).toHaveAttribute("href", "/kayit?next=%2Fogretmen%2Fyeni");
  await expect(
    panel.getByRole("link", { name: "Hesabımı kurtar" }),
  ).toHaveAttribute("href", "/parolami-unuttum?next=%2Fogretmen%2Fyeni");
  expect(
    await second.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  for (const button of await choices.getByRole("button").all()) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({
    path: `${shots}/keyboard-selected.png`,
    animations: "disabled",
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".login-game-cover")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.locator(".login-game-caption h3").evaluate((el) => {
    el.textContent = "UzunTürkçeOyunBaşlığı".repeat(12);
  });
  await page
    .locator(".login-game-choices span")
    .last()
    .evaluate((el) => {
      el.textContent = "UzunDersAdı".repeat(8);
    });
  for (const width of [320, 390, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".account-introduction")).toBeVisible({
      visible: width >= 1024,
    });
  }
  await page.screenshot({
    path: `${shots}/long-text.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(identifier).toBeVisible();
  await page.screenshot({
    path: `${shots}/zoom-200.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("login feedback, submit guard and two-factor controls survive the visual update", async ({
  page,
}) => {
  await page.goto("/giris?verified=1");
  const panel = page.locator(".account-form-panel");
  await expect(panel.getByRole("status")).toContainText(
    "E-posta adresiniz doğrulandı",
  );
  await panel
    .getByLabel("E-posta veya kullanıcı adı")
    .fill("ogretmen@example.test");
  await panel.getByLabel("Parola", { exact: true }).fill("test-parolasi-123");
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/auth/sign-in/email", async (route) => {
    requests++;
    await pending;
    await route.fulfill({
      status: 401,
      json: {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid credentials",
      },
    });
  });
  await panel
    .getByRole("button", { name: "Giriş yap", exact: true })
    .evaluate((el: HTMLButtonElement) => {
      el.click();
      el.click();
    });
  await expect(
    panel.getByRole("button", { name: "Giriş yapılıyor…" }),
  ).toBeDisabled();
  await expect.poll(() => requests).toBe(1);
  await page.screenshot({
    path: `${shots}/submitting.png`,
    animations: "disabled",
  });
  release();
  await expect(panel.getByRole("alert")).toContainText(
    "Bilgiler doğrulanamadı",
  );
  expect(requests).toBe(1);
  await expect(panel.getByLabel("Parola", { exact: true })).toHaveValue(
    "test-parolasi-123",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${shots}/login-error-390.png`,
    fullPage: true,
    animations: "disabled",
  });

  await page.unroute("**/api/auth/sign-in/email");
  await page.route("**/api/auth/sign-in/email", (route) =>
    route.fulfill({ json: { twoFactorRedirect: true } }),
  );
  await panel.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    panel.getByLabel("Doğrulama kodu", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByLabel("Doğrulama kodu", { exact: true }),
  ).toBeFocused();
  await panel.getByRole("button", { name: "Yedek kod kullan" }).click();
  await expect(
    panel.getByLabel("Yedek doğrulama kodu", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `${shots}/two-factor-390.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
