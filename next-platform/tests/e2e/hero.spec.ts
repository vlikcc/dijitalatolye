import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const captures = ".impeccable/review/paper-discovery";

test("workbench keeps games visible and adapts controls at every breakpoint", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("header .brand-mark")).toHaveAttribute(
    "data-entering",
    "false",
  );
  const gameCount = await page.locator(".game-card").count();
  expect(gameCount).toBeGreaterThanOrEqual(16);
  await mkdir(captures, { recursive: true });
  for (const width of [320, 390, 600, 768, 1024, 1440]) {
    const height = width === 1440 ? 900 : width <= 390 ? 844 : 1000;
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Her oyunda yeni bir keşif.",
    );
    await expect(page.locator(".catalog-results")).toContainText(
      `${gameCount} oyun`,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const intro = (await page.locator(".discovery-intro").boundingBox())!;
    const search = (await page.getByRole("search").boundingBox())!;
    const filters = (await page
      .locator(".catalog-filter-strip")
      .boundingBox())!;
    const results = (await page.locator(".catalog-results").boundingBox())!;
    expect((await page.locator(".site-header").boundingBox())!.height).toBe(
      width <= 600 ? 64 : 76,
    );
    if (width >= 1024) {
      expect(search.x).toBeGreaterThan(intro.x + intro.width);
      expect(search.y).toBeLessThan(intro.y + intro.height);
    } else expect(search.y).toBeGreaterThanOrEqual(intro.y + intro.height);
    expect(filters.y).toBeGreaterThanOrEqual(search.y + search.height);
    expect(results.y).toBeGreaterThanOrEqual(filters.y + filters.height);
    await expect(
      page.getByRole("combobox", { name: "Sınıf", exact: true }),
    ).toBeVisible();
    if (width < 768)
      await expect(
        page.getByRole("combobox", { name: "Ders", exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("navigation", { name: "Derse göre keşfet" }),
      ).toBeVisible();
    const cards = page.locator(".game-card");
    expect((await cards.first().boundingBox())!.y).toBeGreaterThanOrEqual(
      results.y + results.height,
    );
    if (width === 1440) {
      for (const card of (await cards.all()).slice(0, 4)) {
        const bounds = (await card.boundingBox())!;
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
      }
    }
    if (width <= 390) {
      for (const element of [
        cards.first().locator(".card-art"),
        cards.first().getByRole("heading"),
      ]) {
        const bounds = (await element.boundingBox())!;
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
      }
    }
    await page.screenshot({
      path: `${captures}/${width}.png`,
      style: "nextjs-portal { visibility: hidden; }",
    });
  }
  await page
    .getByRole("navigation", { name: "Ana menü" })
    .getByRole("link", { name: "Oyunlar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/kesfet$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Her oyunda yeni bir keşif.",
  );
});

test("tablet and mobile menus expose every destination and restore keyboard focus", async ({
  page,
}) => {
  for (const width of [320, 390, 600, 768, 899]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menüyü aç" });
    const nav = page.getByRole("navigation", { name: "Ana menü" });
    await toggle.press("Enter");
    await expect(
      nav.getByRole("link", { name: "Oyunlar", exact: true }),
    ).toBeFocused();
    for (const name of [
      "Oyunlar",
      "Kaydettiklerim",
      "Nasıl kullanılır?",
      "Giriş yap",
    ]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    const bounds = (await nav.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(nav).toBeHidden();
    await toggle.click();
    await page.locator(".catalog-results h2").click();
    await expect(nav).toBeHidden();
    await toggle.click();
    await nav
      .getByRole("link", { name: "Kaydettiklerim", exact: true })
      .click();
    await expect(page).toHaveURL(/saved=1/);
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(
      nav.getByRole("link", { name: "Kaydettiklerim", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

type MotionWindow = Window & {
  puzzleEvents?: string[];
  puzzleNode?: Element | null;
};

test("line-to-color signature completes once and stays static on navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    (window as MotionWindow).puzzleEvents = [];
    for (const name of ["animationstart", "animationend"]) {
      document.addEventListener(name, (event) => {
        if ((event as AnimationEvent).animationName === "puzzle-signature")
          (window as MotionWindow).puzzleEvents!.push(name);
      });
    }
  });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => (window as MotionWindow).puzzleEvents))
    .toEqual(["animationstart", "animationend"]);
  const mark = page.locator("header .brand-mark");
  await expect(mark).toHaveAttribute("data-entering", "false");
  await expect(mark.locator("img")).toBeVisible();
  await expect(mark.locator("img")).toHaveAttribute(
    "src",
    "/brand/puzzle-mark.webp",
  );
  await expect(mark.locator("svg")).toBeHidden();
  await expect(page.locator("footer .brand-mark")).toHaveCount(0);
  await page.evaluate(() => {
    (window as MotionWindow).puzzleNode =
      document.querySelector("header .brand-mark");
  });
  await page
    .getByRole("navigation", { name: "Ana menü" })
    .getByRole("link", { name: "Oyunlar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/kesfet$/);
  await page
    .getByRole("navigation", { name: "Derse göre keşfet" })
    .getByRole("link", { name: "Matematik", exact: true })
    .click();
  await expect(page).toHaveURL(/subject=matematik/);
  expect(
    await mark.evaluate((node) => node === (window as MotionWindow).puzzleNode),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as MotionWindow).puzzleEvents),
  ).toEqual(["animationstart", "animationend"]);
});

test("reduced motion and no JavaScript show the original complete logo", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const mark = page.locator("header .brand-mark");
  await expect(mark.locator("img")).toBeVisible();
  await expect(mark.locator("svg")).toBeHidden();
  expect(
    await mark.evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto(new URL("/", page.url()).href);
  await expect(staticPage.locator("header .brand-mark > img")).toBeVisible();
  await expect(staticPage.locator("header .brand-mark > svg")).toBeHidden();
  await context.close();
});

test("logo drawing and color phases keep the brand footprint fixed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    document.addEventListener("animationstart", (event) => {
      if ((event as AnimationEvent).animationName !== "puzzle-signature")
        return;
      for (const animation of document
        .querySelector(".brand-mark")!
        .getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 150;
      }
    });
  });
  await page.goto("/");
  const mark = page.locator("header .brand-mark");
  await expect(mark).toHaveAttribute("data-entering", "true");
  const before = await mark.boundingBox();
  await mkdir(captures, { recursive: true });
  await mark.screenshot({ path: `${captures}/logo-drawing.png` });
  const colors = mark.locator(".brand-mark-color");
  expect(
    await colors.evaluateAll((nodes) =>
      nodes.every((node) => getComputedStyle(node).opacity === "0"),
    ),
  ).toBe(true);
  await mark.evaluate((node) => {
    for (const animation of node.getAnimations({ subtree: true }))
      animation.currentTime = 550;
  });
  await mark.screenshot({ path: `${captures}/logo-color.png` });
  expect(
    await colors
      .nth(0)
      .evaluate((node) => Number(getComputedStyle(node).opacity)),
  ).toBe(1);
  expect(
    await colors
      .nth(3)
      .evaluate((node) => Number(getComputedStyle(node).opacity)),
  ).toBe(0);
  expect(await mark.boundingBox()).toEqual(before);
  await mark.evaluate((node) => {
    for (const animation of node.getAnimations({ subtree: true }))
      animation.play();
  });
  await expect(mark).toHaveAttribute("data-entering", "false");
  expect(await mark.boundingBox()).toEqual(before);
  await mark.screenshot({ path: `${captures}/logo-complete.png` });
});
