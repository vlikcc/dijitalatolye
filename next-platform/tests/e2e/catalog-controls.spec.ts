import { test, expect, type Page } from "@playwright/test";

const searchField = (page: Page) =>
  page.getByRole("combobox", { name: "Oyun veya konu ara" });
async function grade(page: Page, label: string) {
  await page.getByRole("combobox", { name: "Sınıf", exact: true }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

test("instant filters preserve draft text; search, history and clearing use applied URL state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const initialCount = await page.locator(".game-card").count();
  const search = searchField(page);
  await search.fill("kesir");
  await grade(page, "4. sınıf");
  await expect(page).toHaveURL(/grade=4/);
  await expect(search).toHaveValue("kesir");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  await page
    .getByRole("navigation", { name: "Derse göre keşfet" })
    .getByRole("link", { name: "Matematik", exact: true })
    .click();
  await expect(page).toHaveURL(/subject=matematik/);
  await expect(page).toHaveURL(/grade=4/);
  await expect(search).toHaveValue("kesir");
  await expect(
    page
      .locator(".game-card")
      .getByRole("heading", { name: "Kesir Mutfağı", exact: true }),
  ).toHaveCount(1);
  await search.press("ArrowDown");
  await expect(
    page.getByRole("listbox", { name: "Oyun önerileri" }),
  ).toBeVisible();
  await search.press("Escape");
  await expect(search).toHaveValue("kesir");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/icerik\/demo-kesir-mutfagi\?/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Kesir Mutfağı",
  );
  const back = page.getByRole("link", { name: "Sonuçlara dön", exact: true });
  const from = new URL((await back.getAttribute("href"))!, page.url());
  expect(from.searchParams.get("q")).toBe("kesir");
  expect(from.searchParams.get("grade")).toBe("4");
  expect(from.searchParams.get("subject")).toBe("matematik");
  await back.click();
  await expect(search).toHaveValue("kesir");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("kesir");
  await expect(page.locator(".catalog-section")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const filteredCount = await page.locator(".game-card").count();
  await grade(page, "3. sınıf");
  await expect(page.locator(".game-card")).toHaveCount(0);
  await page.goBack();
  await expect(
    page.getByRole("combobox", { name: "Sınıf", exact: true }),
  ).toHaveText("4. sınıf");
  await expect(page.locator(".game-card")).toHaveCount(filteredCount);
  await page.goForward();
  await expect(
    page.getByRole("combobox", { name: "Sınıf", exact: true }),
  ).toHaveText("3. sınıf");
  await page.getByRole("link", { name: "Filtreleri temizle" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".game-card")).toHaveCount(initialCount);
});

test("rapid selections combine while an earlier server navigation is still pending", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/kesfet");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/kesfet?**", async (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().headers().rsc &&
      url.searchParams.get("grade") === "4" &&
      !url.searchParams.has("subject")
    )
      await gate;
    await route.continue();
  });
  await searchField(page).fill("taslak");
  await grade(page, "4. sınıf");
  await page
    .getByRole("navigation", { name: "Derse göre keşfet" })
    .getByRole("link", { name: "Fen Bilimleri", exact: true })
    .click();
  release();
  await expect(page).toHaveURL(/grade=4/);
  await expect(page).toHaveURL(/subject=fen/);
  await expect(page.locator(".game-card")).toHaveCount(1);
  await expect(page.locator(".game-card")).toContainText("Maddenin Halleri");
  await expect(searchField(page)).toHaveValue("taslak");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
});

test("mobile and tablet suggestions and select menus fit and support keyboard dismissal", async ({
  page,
}) => {
  for (const width of [320, 390, 600, 768, 1024, 1440]) {
    const height = width <= 390 ? 844 : 900;
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const search = searchField(page);
    await search.focus();
    const suggestions = page.getByRole("listbox", { name: "Oyun önerileri" });
    await expect(suggestions).toBeVisible();
    const bounds = (await suggestions.boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
    await search.fill("sözcük");
    const suggestion = page.getByRole("option", {
      name: /^Sözcük Eşleri Türkçe/,
    });
    await suggestion.hover();
    await expect(search).toHaveValue("sözcük");
    await suggestion.click();
    await expect(page).toHaveURL(/\/icerik\/demo-sozcuk-esleri\?/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Sözcük Eşleri",
    );
    await page.goto("/");
    await search.fill("sözcük");
    await search.press("Escape");
    const select = page.getByRole("combobox", { name: "Sınıf", exact: true });
    await select.press("ArrowDown");
    await expect(
      page.getByRole("option", { name: "Tüm sınıflar", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      page.getByRole("option", { name: "12. sınıf", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(select).toBeFocused();
    await grade(page, "4. sınıf");
    await expect(page).toHaveURL(/grade=4/);
    if (width < 768) {
      await page.getByRole("combobox", { name: "Ders", exact: true }).click();
      await page
        .getByRole("option", { name: "Fen Bilimleri", exact: true })
        .click();
    } else {
      await page
        .getByRole("navigation", { name: "Derse göre keşfet" })
        .getByRole("link", { name: "Fen Bilimleri", exact: true })
        .click();
    }
    await expect(page).toHaveURL(/subject=fen/);
    await expect(page.locator(".game-card")).toHaveCount(1);
    await expect(search).toHaveValue("sözcük");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("clearing catalogue filters retains the saved collection", async ({
  page,
}) => {
  await page.goto("/kesfet");
  await page
    .getByRole("button", { name: "Kesir Mutfağı: kaydet", exact: true })
    .click();
  await page.goto("/kesfet?saved=1&grade=3&q=bul");
  await expect(page.locator(".game-card")).toHaveCount(0);
  await page.getByRole("link", { name: "Filtreleri temizle" }).click();
  await expect(page).toHaveURL(/\/kesfet\?saved=1$/);
  await expect(page.locator(".game-card")).toHaveCount(1);
  await expect(page.locator(".game-card")).toContainText("Kesir Mutfağı");
});
