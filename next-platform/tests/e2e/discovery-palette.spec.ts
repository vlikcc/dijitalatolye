import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("paper discovery keeps contrast, background texture and contextual headings scoped", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-card").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const colors = await page.evaluate(() => {
    const style = (selector: string) =>
      getComputedStyle(document.querySelector(selector)!);
    return {
      ink: style(".discovery-intro h1").color,
      muted: style(".discovery-intro p").color,
      background: style("body").backgroundColor,
      gradient: style("body").backgroundImage,
      header: style(".header-shell").backgroundColor,
      button: style(".search-submit").backgroundColor,
      buttonText: style(".search-submit").color,
    };
  });
  expect(colors.background).toBe("rgb(246, 247, 249)");
  expect(colors.header).toBe("rgba(0, 0, 0, 0)");
  expect(colors.gradient).toBe("none");
  function luminance(color: string) {
    const channels = color
      .match(/\d+/g)!
      .map(Number)
      .slice(0, 3)
      .map((v) => {
        const n = v / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  for (const [text, surface] of [
    [colors.ink, colors.background],
    [colors.muted, colors.background],
    [colors.buttonText, colors.button],
  ]) {
    const a = luminance(text),
      b = luminance(surface);
    expect(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  }
  for (const width of [320, 390, 600, 768, 1024, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.evaluate(() => {
      const heading = document.querySelector(".discovery-intro h1")!;
      const before = getComputedStyle(document.body, "::before");
      const after = getComputedStyle(document.body, "::after");
      return {
        lines:
          heading.getBoundingClientRect().height /
          parseFloat(getComputedStyle(heading).lineHeight),
        headingFont: getComputedStyle(heading).fontFamily,
        headingWeight: getComputedStyle(heading).fontWeight,
        nameFont: getComputedStyle(
          document.querySelector("header .brand-name")!,
        ).fontFamily,
        nameWeight: getComputedStyle(
          document.querySelector("header .brand-name")!,
        ).fontWeight,
        before: {
          content: before.content,
          width: parseFloat(before.width),
          top: parseFloat(before.top),
          height: parseFloat(before.height),
          image: before.backgroundImage,
          opacity: before.opacity,
          zIndex: before.zIndex,
          pointerEvents: before.pointerEvents,
        },
        after: { content: after.content },
        firstCardTop: document
          .querySelector(".game-card")!
          .getBoundingClientRect().top,
      };
    });
    expect(geometry.headingFont).toContain("Manrope Variable");
    expect(geometry.headingWeight).toBe("750");
    expect(geometry.nameFont).toContain("Manrope Variable");
    expect(geometry.nameWeight).toBe("800");
    expect(geometry.lines).toBeLessThanOrEqual(width <= 390 ? 2.01 : 1.01);
    expect(geometry.before.top).toBe(0);
    expect(geometry.before.width).toBe(width);
    expect(geometry.before.height).toBeLessThanOrEqual(
      geometry.firstCardTop + 8,
    );
    expect(geometry.before.image).toContain("/textures/paper-001.webp");
    expect(geometry.before.opacity).toBe("0.05");
    expect(geometry.before.zIndex).toBe("-1");
    expect(geometry.before.pointerEvents).toBe("none");
    expect(geometry.after.content).toBe("none");
  }
  const input = page.getByRole("combobox", { name: "Oyun veya konu ara" });
  await input.focus();
  await expect(page.getByRole("search")).toHaveCSS(
    "outline-color",
    "rgb(59, 95, 140)",
  );
  await page.goto("/kesfet?subject=matematik");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Matematik oyunları",
  );
  await page.goto("/kesfet?saved=1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Senin keşif koleksiyonun",
  );
  await page.goto("/giris");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(246, 247, 249)",
  );
  await expect(page.locator(".header-shell")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
});

test("local Manrope covers Turkish and delayed loading leaves the first game in place", async ({
  context,
}) => {
  const measurements = [];
  for (const width of [320, 390, 1024, 1440]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    const fontRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "font") fontRequests.push(request.url());
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/manrope-*.woff2", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/kesfet", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".game-card").first()).toBeVisible();
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('400 16px "Source Sans 3"', "İı Şş Ğğ Çç Öö Üü"),
        document.fonts.load('600 16px "Source Sans 3"', "İı Şş Ğğ Çç Öö Üü"),
      ]);
    });
    const before = (await page.locator(".game-card").first().boundingBox())!;
    await page.evaluate(() => {
      (window as Window & { fontShifts?: number[] }).fontShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          (window as Window & { fontShifts?: number[] }).fontShifts!.push(
            (entry as PerformanceEntry & { value: number }).value,
          );
      }).observe({ type: "layout-shift" });
    });
    release();
    const loaded = await page.evaluate(async () => {
      await document.fonts.load(
        '800 28px "Manrope Variable"',
        "İı Şş Ğğ Çç Öö Üü",
      );
      await document.fonts.ready;
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      return {
        turkish: document.fonts.check(
          '800 28px "Manrope Variable"',
          "İı Şş Ğğ Çç Öö Üü",
        ),
        shifts: (window as Window & { fontShifts?: number[] }).fontShifts ?? [],
      };
    });
    const after = (await page.locator(".game-card").first().boundingBox())!;
    expect(loaded.turkish).toBe(true);
    expect(fontRequests.some((url) => url.includes("manrope-latin-ext"))).toBe(
      true,
    );
    expect(fontRequests.some((url) => url.includes("manrope-latin-wght"))).toBe(
      true,
    );
    expect(
      fontRequests.every(
        (url) => new URL(url).origin === new URL(page.url()).origin,
      ),
    ).toBe(true);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    const shift = loaded.shifts.reduce((sum, value) => sum + value, 0);
    expect(shift).toBeLessThan(0.01);
    measurements.push({
      width,
      firstCardDelta: after.y - before.y,
      fontLayoutShift: shift,
    });
    await page.close();
  }
  await mkdir(".impeccable/review/paper-discovery", { recursive: true });
  await writeFile(
    ".impeccable/review/paper-discovery/font-loading.json",
    JSON.stringify(measurements, null, 2),
  );
});

test("missing paper texture leaves search and filtering usable on the neutral canvas", async ({
  page,
}) => {
  await page.route("**/textures/paper-001.webp", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(246, 247, 249)",
  );
  const search = page.getByRole("combobox", { name: "Oyun veya konu ara" });
  await search.fill("kesir");
  await page.getByRole("button", { name: "Oyun ara" }).click();
  await expect(page).toHaveURL(/q=kesir/);
  await expect(
    page.getByRole("heading", { name: "Kesir Mutfağı", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      (await page.locator(".game-card").allTextContents()).every((title) =>
        title.toLocaleLowerCase("tr").includes("kesir"),
      ),
    )
    .toBe(true);
});
