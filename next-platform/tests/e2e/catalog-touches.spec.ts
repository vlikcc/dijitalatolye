import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const captures = ".impeccable/review/catalog-touches";

test("individual filters preserve the collection and draft, and keep keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Kesir Mutfağı: kaydet", exact: true })
    .click();
  await page.goto("/kesfet?saved=1&q=kesir&grade=4&subject=matematik");
  const chips = page.getByRole("group", { name: "Etkin filtreler" });
  const search = page.getByRole("combobox", { name: "Oyun veya konu ara" });
  await expect(chips.getByRole("button")).toHaveCount(3);
  await search.fill("henüz uygulanmayan taslak");
  await chips
    .getByRole("button", { name: "4. sınıf filtresini kaldır" })
    .press("Enter");
  await expect(page).not.toHaveURL(/grade=/);
  await expect(page).toHaveURL(/subject=matematik/);
  await expect(page).toHaveURL(/q=kesir/);
  await expect(search).toHaveValue("henüz uygulanmayan taslak");
  const subject = chips.getByRole("button", {
    name: "Matematik filtresini kaldır",
  });
  await expect(subject).toBeFocused();
  await subject.press("Enter");
  await expect(page).not.toHaveURL(/subject=/);
  const query = chips.getByRole("button", {
    name: "“kesir” filtresini kaldır",
  });
  await expect(query).toBeFocused();
  await query.press("Enter");
  await expect(page).toHaveURL(/\/kesfet\?saved=1$/);
  await expect(search).toHaveValue("");
  await expect(chips).toHaveCount(0);
  await expect(page.locator(".catalog-results h2")).toBeFocused();
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page.goBack();
  await expect(query).toBeVisible();
  await expect(search).toHaveValue("kesir");
});

test("subject indicator follows selection, wrapped rows, resizing and history", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const nav = page.getByRole("navigation", { name: "Derse göre keşfet" });
  const indicator = nav.locator(".subject-tab-indicator");
  for (const width of [1440, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const subject of ["Matematik", "Türkçe", "Tüm oyunlar"]) {
      const link = nav.getByRole("link", { name: subject, exact: true });
      await link.press("Enter");
      await expect(link).toHaveAttribute("aria-current", "page");
      await expect(link).toBeFocused();
      await expect
        .poll(async () => {
          const a = (await link.boundingBox())!;
          const b = (await indicator.boundingBox())!;
          return (
            Math.abs(b.x - (a.x + 10)) +
            Math.abs(b.y + b.height - (a.y + a.height)) +
            Math.abs(b.width - (a.width - 20))
          );
        })
        .toBeLessThan(2);
    }
  }
  await page.goBack();
  await expect(
    nav.getByRole("link", { name: "Türkçe", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(indicator).toHaveCSS("background-color", "rgb(167, 70, 77)");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(indicator).toBeVisible();
});

test("save feedback confirms a real change, persists, and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page
    .locator(".game-card")
    .filter({
      has: page.getByRole("heading", { name: "Kesir Mutfağı", exact: true }),
    });
  const button = card.getByRole("button");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator(".save-feedback")).toHaveText("Kaydedildi");
  await expect(card.getByRole("status")).toHaveText(
    "Kesir Mutfağı: Kaydedildi",
  );
  expect(
    await card.evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
  const nav = page.getByRole("navigation", { name: "Derse göre keşfet" });
  await expect(nav.locator(".subject-tab-indicator")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(card.locator(".save-feedback")).toHaveCount(0);
  await page.reload();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator(".save-feedback")).toHaveCount(0);
  await button.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(card.locator(".save-feedback")).toHaveText("Kayıt kaldırıldı");
  await button.press("Enter");
  await expect(card.locator(".save-feedback")).toHaveText("Kaydedildi");
});

test("blocked storage shows an error without a false saved confirmation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.goto("/");
  const card = page.locator(".game-card").first();
  const button = card.getByRole("button");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(card.locator(".save-error")).toBeVisible();
  await expect(card.locator(".save-feedback")).toHaveCount(0);
  await expect(card.locator(".save-icon-feedback")).toHaveCount(0);
});

test("mobile feedback and long filter labels remain inside the viewport", async ({
  page,
}) => {
  await mkdir(captures, { recursive: true });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const card = page.locator(".game-card").first();
    await card.getByRole("button").click();
    const feedback = card.locator(".save-feedback");
    await expect(feedback).toBeVisible();
    const box = (await feedback.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${captures}/save-${width}.png` });
    await page.goto(`/?grade=4&subject=matematik&q=${"a".repeat(120)}`);
    const chips = page.getByRole("group", { name: "Etkin filtreler" });
    await expect(chips.getByRole("button")).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const button of await chips.getByRole("button").all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: `${captures}/filters-${width}.png` });
  }
});
