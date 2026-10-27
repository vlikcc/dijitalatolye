import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { demoGames } from "../../src/games/demos";
test.describe("16 playable activities", () => {
  for (const game of demoGames)
    test(`${game.title}: retry, complete and restart`, async ({ page }) => {
      await page.goto(`/demo-games/${game.slug}`);
      await page.getByRole("button", { name: "Başla", exact: true }).click();
      for (const round of game.rounds) {
        await expect(
          page.getByRole("heading", { name: round.prompt, exact: true }),
        ).toBeVisible();
        const button = (name: string) =>
          page.getByRole("button", { name, exact: true });
        if (round.type === "choice") {
          await button(round.options.find((a) => a !== round.answer)!).click();
          await expect(page.getByRole("status")).toContainText(
            "Bir daha deneyelim",
          );
          await button(round.answer).click();
        } else if (round.type === "match") {
          await button(round.pairs[0][0]).click();
          await button(round.pairs[1][1]).click();
          await expect(page.getByRole("status")).toContainText(
            "Bir daha deneyelim",
          );
          for (const [left, right] of round.pairs) {
            await button(left).click();
            await button(right).click();
          }
        } else if (round.type === "order") {
          for (const label of [...round.items].reverse())
            await button(label).click();
          await button("Sıralamayı kontrol et").click();
          await expect(page.getByRole("status")).toContainText(
            "Bir daha deneyelim",
          );
          for (const label of [...round.items].reverse())
            await page
              .locator(".sequence-item")
              .filter({ hasText: label })
              .click();
          for (const label of round.items) await button(label).click();
          await button("Sıralamayı kontrol et").click();
        } else {
          await button(round.items[0].label).click();
          await button(
            round.groups.find((g) => g !== round.items[0].group)!,
          ).click();
          await expect(page.getByRole("status")).toContainText(
            "Bir daha deneyelim",
          );
          for (const item of round.items) {
            await button(item.label).click();
            await button(item.group).click();
          }
        }
        await expect(page.getByRole("status")).toContainText(round.explanation);
        await page.locator("#next").click();
      }
      await expect(
        page.getByRole("heading", { name: "Keşfi tamamladın!" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Yeniden oyna" }).click();
      await expect(
        page.getByRole("heading", { name: game.rounds[0].prompt, exact: true }),
      ).toBeVisible();
      await expect(page.locator("#progress-label")).toHaveText(
        `Etkinlik 1 / ${game.rounds.length}`,
      );
    });
});
test("discovery filters, return navigation and browser-local saved games", async ({
  page,
}) => {
  await page.goto("/kesfet?subject=turkce&grade=3&q=sözcük");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Sözcük Eşleri: kaydet", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Sözcük Eşleri: kaydı kaldır",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("heading", { name: "Sözcük Eşleri", exact: true })
    .getByRole("link")
    .click();
  await page.getByRole("link", { name: "Sonuçlara dön" }).click();
  await expect(page).toHaveURL(/subject=turkce/);
  await expect(page).toHaveURL(/grade=3/);
  await page.goto("/kesfet?saved=1");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Sözcük Eşleri: kaydı kaldır", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Koleksiyonuna bir oyun ekle" }),
  ).toBeVisible();
  await page.goto("/kesfet?q=xyzunmatched");
  await expect(
    page.getByRole("heading", { name: "Henüz bir eşleşme yok" }),
  ).toBeVisible();
});
test("inline game isolation, legacy redirect, sharing fallback and fullscreen", async ({
  page,
}) => {
  await page.goto("/oyna/demo-kesir-mutfagi");
  await expect(page).toHaveURL(/\/icerik\/demo-kesir-mutfagi\?oyna=1/);
  await expect(page.locator("iframe")).toHaveAttribute(
    "sandbox",
    "allow-scripts",
  );
  const game = page.frameLocator("iframe");
  await expect(
    game.getByRole("heading", {
      name: demoGames[0].rounds[0].prompt,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Oyunu yeniden başlat" }).click();
  await expect(game.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
  await expect(page.locator(".player-loading")).toHaveCount(0);
  await page.getByRole("button", { name: "Tam ekran", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tam ekrandan çık" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tam ekrandan çık" }).click();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    }),
  );
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true);
  await page.getByRole("button", { name: "Paylaş", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Bağlantıyı kopyala", exact: true })
    .click();
  await expect(page.getByLabel("Paylaşım bağlantısı")).toHaveValue(
    /\/icerik\/demo-kesir-mutfagi$/,
  );
});
test("mobile controls and public teacher entry points", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Ana menü" })
      .getByRole("link", { name: "Nasıl kullanılır?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menüyü kapat" }).click();
  await page.getByRole("combobox", { name: "Sınıf", exact: true }).click();
  await page.getByRole("option", { name: "4. sınıf", exact: true }).click();
  await page.getByRole("combobox", { name: "Ders", exact: true }).click();
  await page
    .getByRole("option", { name: "Fen Bilimleri", exact: true })
    .click();
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page.goto("/giris");
  await expect(page.locator(".auth-box")).toBeVisible();
  await page.goto("/ogretmen/yeni");
  await expect(page).toHaveURL(/\/giris/);
});
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
async function readyForCapture(page: Page, contentSelector: string) {
  await expect(page.locator(contentSelector)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const images = page.locator("img");
  // Exercise actual lazy loading before taking a full-page screenshot.
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await img.evaluate((node: HTMLImageElement) => node.decode());
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
test("responsive visual evidence and accessible discovery controls", async ({
  page,
}) => {
  await mkdir(".impeccable/review", { recursive: true });
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".game-card .demo-label")).toHaveCount(16);
    await expect(page.locator(".card-art img").first()).toBeVisible();
    await readyForCapture(page, ".discovery");
    await noOverflow(page);
    await page.screenshot({
      path: `.impeccable/review/catalog-${width}.png`,
      fullPage: true,
    });
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `.impeccable/review/catalog-${width}-viewport.png`,
      });
    await page.goto("/icerik/demo-kesir-mutfagi");
    await readyForCapture(page, ".heading-title h1");
    await noOverflow(page);
    await page.screenshot({
      path: `.impeccable/review/detail-${width}.png`,
      fullPage: true,
    });
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `.impeccable/review/detail-${width}-viewport.png`,
      });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await readyForCapture(page, ".discovery");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "İçeriğe geç" })).toBeFocused();
  await page.screenshot({ path: ".impeccable/review/focus-desktop.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/icerik/demo-kesir-mutfagi?oyna=1");
    const game = page.frameLocator("iframe");
    await expect(game.locator("#prompt")).toBeVisible();
    await expect(page.locator(".player-loading")).toHaveCount(0);
    await game.locator("body").evaluate(async (body) => {
      await body.ownerDocument.fonts.ready;
    });
    expect(
      await game
        .locator("#prompt")
        .evaluate((node) => getComputedStyle(node).fontFamily),
    ).toContain("Manrope Variable");
    expect(
      await game
        .locator("body")
        .evaluate((body) =>
          body.ownerDocument.fonts.check(
            '700 23px "Manrope Variable"',
            "Keşfi tamamladın ğüşİı",
          ),
        ),
    ).toBe(true);
    expect(
      await game
        .locator("body")
        .evaluate((body) =>
          body.ownerDocument.fonts.check(
            '400 16px "Source Sans 3"',
            "Keşfi tamamladın ğüşİı",
          ),
        ),
    ).toBe(true);
    await game.getByRole("button", { name: "3/5", exact: true }).click();
    await readyForCapture(page, ".heading-title h1");
    await page.screenshot({
      path: `.impeccable/review/playing-${width}.png`,
      fullPage: true,
    });
    for (const round of demoGames[0].rounds) {
      if (round.type !== "choice")
        throw Error("Completion capture expects choice activity");
      await game
        .getByRole("button", { name: round.answer, exact: true })
        .click();
      await game.locator("#next").click();
    }
    await expect(
      game.getByRole("heading", { name: "Keşfi tamamladın!" }),
    ).toBeVisible();
    await expect(game.locator(".complete-mark svg")).toBeVisible();
    await readyForCapture(page, ".heading-title h1");
    await page.screenshot({
      path: `.impeccable/review/completed-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await readyForCapture(page, ".catalog-filter-strip");
  await noOverflow(page);
  await page.screenshot({
    path: ".impeccable/review/filters-390.png",
    fullPage: true,
  });
  await page.goto("/kesfet?q=xyzunmatched");
  await readyForCapture(page, ".empty");
  await page.screenshot({
    path: ".impeccable/review/empty-390.png",
    fullPage: true,
  });
  await page.goto("/giris");
  await readyForCapture(page, ".auth-box");
  await page.screenshot({
    path: ".impeccable/review/login-390.png",
    fullPage: true,
  });
});
