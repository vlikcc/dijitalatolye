import { expect, test } from "@playwright/test";

for (const width of [1440, 390, 320]) {
  test(`preview starts and header returns to the same game at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const returnTo = "/kesfet?subject=hayat&grade=3";
    await page.goto(
      `/icerik/demo-yonunu-bul?from=${encodeURIComponent(returnTo)}`,
    );
    await expect(
      page.getByRole("link", { name: "Sonuçlara dön" }),
    ).toHaveAttribute("href", returnTo);
    const launch = page.getByRole("button", {
      name: "Oyuna başla",
      exact: true,
    });
    await expect(launch).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

    await expect(page.locator(".game-information")).toContainText("Öğrenme hedefi");
    await launch.click();
    const game = page.frameLocator("iframe");
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
    await game.getByRole("button", { name: "Doğu", exact: true }).click();
    await game.locator("#next").click();
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
    await page.locator("iframe").evaluate((frame) => {
      frame.dataset.identity = "same-session";
    });

    await page.getByRole("button", { name: "Oyuna dön", exact: true }).click();
    await expect(page.locator("iframe")).toHaveAttribute(
      "data-identity",
      "same-session",
    );
    await expect(game.locator("#progress-label")).toHaveText("Etkinlik 2 / 3");
    await expect(page.locator(".player-wrap")).toBeFocused();
    const bounds = (await page.locator(".player-wrap").boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(845);
  });
}

test("compact save and share controls remain accessible on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/icerik/demo-sozcuk-esleri");
  await page
    .getByRole("button", { name: "Sözcük Eşleri: kaydet", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Sözcük Eşleri: kaydı kaldır",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Sözcük Eşleri: kaydı kaldır",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Paylaş", exact: true }).click();
  await page.getByRole("button", { name: "Bağlantıyı kopyala", exact: true }).click();
  await expect(page.getByLabel("Paylaşım bağlantısı")).toHaveValue(
    /\/icerik\/demo-sozcuk-esleri$/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
