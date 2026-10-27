import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

async function settleCapture(page: Page) {
  for (const image of await page.locator("img").all()) {
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
}

// Avoid Chrome's repeated texture strip beyond 16384px without changing the UI.
async function captureDocument(page: Page, path: string) {
  await settleCapture(page);
  const { width, height } = page.viewportSize()!;
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const strips: { input: Buffer; left: number; top: number }[] = [];
  for (let top = 0; top < total; top += height) {
    const actual = await page.evaluate(async (y) => {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      return scrollY;
    }, top);
    const input = await sharp(
      await page.screenshot({ animations: "disabled", scale: "css" }),
    )
      .extract({
        left: 0,
        top: top - actual,
        width,
        height: Math.min(height, total - top),
      })
      .png()
      .toBuffer();
    strips.push({ input, left: 0, top });
  }
  const image = await sharp({
    create: { width, height: total, channels: 3, background: "#f6f7f9" },
  })
    .composite(strips)
    .png()
    .toBuffer();
  await sharp(image).toFile(path);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  return image;
}

test("shared public surfaces, compact closure and responsive account states", async ({
  page,
}) => {
  await mkdir(".impeccable/review/unified", { recursive: true });
  for (const [name, route] of [
    ["home", "/"],
    ["game", "/icerik/demo-kesir-mutfagi"],
    ["login", "/giris"],
    ["recovery", "/parolami-unuttum"],
  ]) {
    await page.goto(route);
    await expect(
      page.locator(name === "home" ? ".game-card" : "h1").first(),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.brand-mark[data-entering="true"]')).toHaveCount(
      0,
    );
    for (const width of [320, 390, 600, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        name + width,
      ).toBe(true);
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        "rgb(246, 247, 249)",
      );
      for (const control of await page
        .locator(
          ".nav a, .menu-toggle, .save-button, .password-input button, .button-sm",
        )
        .all()) {
        if (!(await control.isVisible())) continue;
        const box = (await control.boundingBox())!;
        expect(
          box.width,
          `${name} ${width}: target width`,
        ).toBeGreaterThanOrEqual(44);
        expect(
          box.height,
          `${name} ${width}: target height`,
        ).toBeGreaterThanOrEqual(44);
      }
      if (name === "home" && width === 1440)
        expect(
          (await page.locator(".game-card").nth(3).boundingBox())!.y +
            (await page.locator(".game-card").nth(3).boundingBox())!.height,
        ).toBeLessThanOrEqual(900);
      if (name === "home" && width === 390)
        expect(
          (await page.locator(".game-card h3").first().boundingBox())!.y +
            (await page.locator(".game-card h3").first().boundingBox())!.height,
        ).toBeLessThanOrEqual(844);
      if (width === 390 || width === 1440) {
        const image = await captureDocument(
          page,
          `.impeccable/review/unified/${name}-${width}.png`,
        );
        if (name === "home") {
          const footer = await page.locator(".footer-shell").boundingBox();
          const { height: documentHeight } = await sharp(image).metadata();
          const top = Math.max(0, Math.floor(footer!.y));
          await sharp(image)
            .extract({
              left: 0,
              top,
              width,
              height: Math.min(
                Math.ceil(footer!.height),
                documentHeight! - top,
              ),
            })
            .toFile(`.impeccable/review/unified/footer-${width}.png`);
        }
      }
    }
  }
  await page.goto("/giris");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await expect(
    page.getByRole("button", { name: "Menüyü kapat" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/unified/menu-390.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/icerik/demo-kesir-mutfagi");
  await expect(page.locator(".brand-mark")).toHaveAttribute(
    "data-entering",
    "false",
  );
  await page.getByRole("button", { name: "Oyuna başla", exact: true }).click();
  await expect(
    page.frameLocator("iframe").locator("#progress-label"),
  ).toHaveText("Etkinlik 1 / 3");
  const bounds = (await page.locator(".player-wrap").boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await page.screenshot({
    path: ".impeccable/review/unified/game-active-390.png",
    animations: "disabled",
  });
});
