import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { demoGames } from "../../src/games/demos";

test("cinema has a visible exit and its backdrop closes without restarting play", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/icerik/demo-sozcuk-esleri");
    const player = page.locator(".player-wrap");
    const enter = () =>
      page.getByRole("button", { name: "Sinema modu", exact: true });
    const exit = () =>
      page.getByRole("button", { name: "Sinema modundan çıkış", exact: true });
    await enter().click();
    await expect(exit().getByText("Çıkış", { exact: true })).toBeVisible();
    await exit().click();
    await expect(player).toHaveAttribute("data-theater", "false");
    await expect(page.locator(".player-backdrop")).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Oyuna başla", exact: true })
      .click();
    const game = page.frameLocator("iframe");
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 1 / 2");
    await page.locator("iframe").evaluate((element) => {
      element.dataset.identity = "original";
    });
    await enter().click();
    await game.getByRole("button", { name: "Yanıt", exact: true }).click();
    await expect(player).toHaveAttribute("data-theater", "true");
    await expect(
      game.getByRole("button", { name: "Yanıt", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/cinema-exit-${viewport.width}.png`,
    });
    await page
      .getByRole("button", { name: "Sinema modunu kapat", exact: true })
      .click({ position: { x: 8, y: 8 } });
    await expect(player).toHaveAttribute("data-theater", "false");
    await expect(page.locator(".player-backdrop")).toHaveCount(0);
    await expect(enter()).toBeFocused();
    await expect(page.locator("iframe")).toHaveAttribute(
      "data-identity",
      "original",
    );
    await expect(
      game.getByRole("button", { name: "Yanıt", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
});

async function playerFits(page: Page) {
  await expect
    .poll(() =>
      page.locator(".player-wrap").evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.top >= -1 && bounds.bottom <= window.innerHeight + 1;
      }),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function contentFits(page: Page) {
  await page
    .frameLocator("iframe")
    .locator("body")
    .evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  await expect
    .poll(() =>
      page
        .frameLocator("iframe")
        .locator("#game-content")
        .evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            bounds.top >= -1 &&
            bounds.left >= -1 &&
            bounds.right <= innerWidth + 1 &&
            bounds.bottom <= innerHeight + 1
          );
        }),
    )
    .toBe(true);
}

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`player fits and preserves progress across modes at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/icerik/demo-yonunu-bul");
    const player = page.locator(".player-wrap");
    await expect(player).toBeVisible();
    const previewHeight = (await player.boundingBox())!.height;
    if (viewport.width === 390) {
      const start = (await page
        .getByRole("button", { name: "Oyuna başla", exact: true })
        .boundingBox())!;
      expect(start.y).toBeGreaterThan(0);
      expect(start.y + start.height).toBeLessThanOrEqual(viewport.height);
    }
    await page
      .getByRole("button", { name: "Oyuna başla", exact: true })
      .click();
    const game = page.frameLocator("iframe");
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
    if (viewport.width <= 767)
      expect((await player.boundingBox())!.height).toBeGreaterThan(
        previewHeight,
      );
    else expect((await player.boundingBox())!.height).toBe(previewHeight);
    await playerFits(page);
    await contentFits(page);
    await game.getByRole("button", { name: "Batı", exact: true }).click();
    await contentFits(page);
    await game.getByRole("button", { name: "Doğu", exact: true }).click();
    await contentFits(page);
    await game.locator("#next").click();
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
    await contentFits(page);
    await page.locator("iframe").evaluate((element) => {
      element.dataset.identity = "original";
    });
    const standardWidth = (await player.boundingBox())!.width;
    if (viewport.width === 1366 || viewport.width === 390) {
      await mkdir(".impeccable/review", { recursive: true });
      await page.screenshot({
        path: `.impeccable/review/player-standard-${viewport.width}.png`,
      });
    }
    await page
      .getByRole("button", { name: "Sinema modu", exact: true })
      .click();
    await expect(player).toHaveAttribute("data-theater", "true");
    await expect(
      page.getByRole("button", { name: "Sinema modundan çık" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
    await playerFits(page);
    await contentFits(page);
    if (viewport.width > 900) {
      expect((await player.boundingBox())!.width).toBeGreaterThan(
        standardWidth,
      );
      const info = (await page.locator(".game-information").boundingBox())!;
      const bounds = (await player.boundingBox())!;
      expect(info.y).toBeGreaterThan(bounds.y + bounds.height);
    }
    if (viewport.width === 1366 || viewport.width === 390)
      await page.screenshot({
        path: `.impeccable/review/player-cinema-${viewport.width}.png`,
      });
    await page.getByRole("button", { name: "Tam ekran", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Tam ekrandan çık" }),
    ).toBeVisible();
    await playerFits(page);
    await contentFits(page);
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
    await page.getByRole("button", { name: "Tam ekrandan çık" }).click();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement === null))
      .toBe(true);
    await expect(player).toHaveAttribute("data-theater", "true");
    await game.locator("#prompt").press("Escape");
    await expect(player).toHaveAttribute("data-theater", "false");
    await expect(page.locator("iframe")).toHaveAttribute(
      "data-identity",
      "original",
    );
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
    await playerFits(page);
    await contentFits(page);
    await page.getByRole("button", { name: "Oyunu yeniden başlat" }).click();
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
    await contentFits(page);
  });
}

test("an active game stays visible through orientation changes and keyboard play", async ({
  page,
}) => {
  await page.goto("/icerik/demo-yonunu-bul?oyna=1");
  const game = page.frameLocator("iframe");
  await expect(game.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
  await game.getByRole("button", { name: "Doğu", exact: true }).press("Enter");
  await game.locator("#next").press("Enter");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await playerFits(page);
    await contentFits(page);
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
  }
  await game.getByRole("button", { name: "Batı", exact: true }).press("Enter");
  await expect(game.getByRole("status")).toContainText("Doğru!");
  await contentFits(page);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  for (const slug of [
    "demo-sozcuk-esleri",
    "demo-gezegen-sirasi",
    "demo-geri-donusum",
  ]) {
    test(`${slug} fits all rounds and completion at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/icerik/${slug}?oyna=1`);
      const demo = demoGames.find((item) => item.slug === slug)!;
      const game = page.frameLocator("iframe");
      await expect(game.locator("#progress-label")).toHaveText(
        `Etkinlik 1 / ${demo.rounds.length}`,
      );
      await playerFits(page);
      for (const round of demo.rounds) {
        await contentFits(page);
        const answer = (name: string) =>
          game.getByRole("button", { name, exact: true });
        if (round.type === "match") {
          for (const [left, right] of round.pairs) {
            await answer(left).click();
            await answer(right).click();
            await contentFits(page);
          }
        } else if (round.type === "order") {
          for (const item of round.items) {
            await answer(item).click();
            await contentFits(page);
          }
          await answer("Sıralamayı kontrol et").click();
        } else if (round.type === "sort") {
          for (const item of round.items) {
            await answer(item.label).click();
            await answer(item.group).click();
            await contentFits(page);
          }
        }
        await expect(game.getByRole("status")).toContainText(round.explanation);
        await contentFits(page);
        await game.locator("#next").press("Enter");
      }
      await expect(
        game.getByRole("heading", { name: "Keşfi tamamladın!" }),
      ).toBeVisible();
      await contentFits(page);
      await game.getByRole("button", { name: "Yeniden oyna" }).click();
      await expect(game.locator("#progress-label")).toHaveText(
        `Etkinlik 1 / ${demo.rounds.length}`,
      );
      await contentFits(page);
    });
  }
}
