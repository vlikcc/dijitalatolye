import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const search = (page: Page) =>
  page.getByRole("combobox", { name: "Oyun veya konu ara" });
const savedKey = "dijital-oyun-atolyesi:saved:v1";
const save = (page: Page, title: string, remove = false) =>
  page.getByRole("button", {
    name: `${title}: ${remove ? "kaydı kaldır" : "kaydet"}`,
    exact: true,
  });

test("Turkish query highlights the original spelling in suggestions and applied results", async ({
  page,
}) => {
  await page.goto("/?subject=turkce");
  await expect(page.locator(".discovery-intro p")).toHaveText(
    "Sözcüklerle düşün, anlamı keşfet.",
  );
  await search(page).fill("SOZCUK");
  const suggestions = page.getByRole("listbox", { name: "Oyun önerileri" });
  await expect(suggestions.locator("strong mark")).toHaveText("Sözcük");
  await expect(
    suggestions
      .getByRole("option")
      .filter({ hasText: "Cümle Ustası" })
      .locator(".suggestion-excerpt mark"),
  ).toHaveText("sözcük");
  await search(page).press("Escape");
  await search(page).press("Enter");
  await expect(page.locator(".game-card h3 mark")).toHaveText("Sözcük");
  await expect(
    page
      .locator(".game-card")
      .filter({ hasText: "Cümle Ustası" })
      .locator("p mark"),
  ).toHaveText("sözcük");
  await mkdir(".impeccable/review/catalog-micro", { recursive: true });
  await page.screenshot({
    path: ".impeccable/review/catalog-micro/search-desktop.png",
  });
});

test("contextual empty actions remove only the named filter and retain saved scope", async ({
  page,
}) => {
  await page.goto("/?subject=turkce");
  await save(page, "Sözcük Eşleri").click();
  await page.goto("/kesfet?saved=1&subject=turkce&grade=4&q=uzay");
  await expect(page.locator(".empty")).toContainText(
    "Kaydettiklerinde bu filtrelerle eşleşen oyun yok.",
  );
  await expect(
    page.getByRole("heading", { name: "Koleksiyonuna bir oyun ekle" }),
  ).toHaveCount(0);
  await page
    .locator(".empty")
    .getByRole("link", { name: "Aramayı temizle" })
    .press("Enter");
  await expect(page).not.toHaveURL(/q=/);
  await expect(page).toHaveURL(/saved=1/);
  await expect(page).toHaveURL(/subject=turkce/);
  await expect(page).toHaveURL(/grade=4/);
  await page
    .locator(".empty")
    .getByRole("link", { name: "Tüm sınıfları göster" })
    .press("Enter");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await expect(page.locator(".game-card h3")).toHaveText("Sözcük Eşleri");
});

test("undo survives the final card disappearing and preserves later changes from another tab", async ({
  page,
  context,
}) => {
  await page.goto("/?subject=turkce");
  await save(page, "Sözcük Eşleri").click();
  await page.goto("/kesfet?saved=1");
  await save(page, "Sözcük Eşleri", true).press("Enter");
  await expect(page.locator(".game-card")).toHaveCount(0);
  const undo = page.getByRole("button", { name: "Geri al", exact: true });
  await expect(undo).toBeFocused();
  const other = await context.newPage();
  await other.goto("/?subject=turkce");
  await save(other, "Cümle Ustası").click();
  await expect(page.locator(".game-card")).toHaveCount(1);
  await undo.press("Enter");
  await expect(page.locator(".game-card")).toHaveCount(2);
  await expect(save(page, "Sözcük Eşleri", true)).toBeFocused();
  await expect(page.locator(".saved-notice")).toContainText(
    "yeniden kaydedildi",
  );
  await page.getByRole("button", { name: "Bildirimi kapat" }).press("Enter");
  await expect(save(page, "Sözcük Eşleri", true)).toBeFocused();
  await expect(save(page, "Sözcük Eşleri", true)).not.toHaveAttribute(
    "tabindex",
    "-1",
  );
  await other.close();
});

test("consecutive removals undo only the latest and storage failure does not claim success", async ({
  page,
}) => {
  await page.goto("/?subject=turkce");
  await save(page, "Sözcük Eşleri").click();
  await save(page, "Cümle Ustası").click();
  await save(page, "Sözcük Eşleri", true).click();
  await save(page, "Cümle Ustası", true).click();
  await expect(page.locator(".saved-notice")).toContainText(
    "Cümle Ustası kayıtlardan kaldırıldı",
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.getByRole("button", { name: "Geri al", exact: true }).click();
  await expect(page.locator(".saved-notice")).toContainText(
    "Kayıt geri alınamadı",
  );
  await expect(save(page, "Cümle Ustası")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(save(page, "Sözcük Eşleri")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("a delayed navigation shows real pending feedback and retains old cards", async ({
  page,
}) => {
  await page.goto("/kesfet?subject=turkce");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/kesfet?**", async (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().headers().rsc &&
      url.searchParams.get("subject") === "matematik"
    )
      await gate;
    await route.continue();
  });
  try {
    await page
      .getByRole("navigation", { name: "Derse göre keşfet" })
      .getByRole("link", { name: "Matematik", exact: true })
      .click();
    await expect(page.locator(".catalog-result-count")).toHaveText(
      "Oyunlar güncelleniyor…",
    );
    await expect(
      page.locator(".game-card h3").filter({ hasText: "Sözcük Eşleri" }),
    ).toBeVisible();
    await expect(page.locator(".catalog-loading")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.locator(".catalog-section")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const cardCount = await page.locator(".game-card").count();
  expect(cardCount).toBeGreaterThan(0);
  await expect(page.locator(".catalog-result-count")).toHaveText(
    `${cardCount} oyun`,
  );
  await expect(page.locator(".discovery-intro p")).toHaveText(
    "Bir yol dene, çözümü keşfet.",
  );
});

test("slash focuses search, supports Turkish Shift slash, and never consumes typed input", async ({
  page,
}) => {
  await page.goto("/?subject=turkce");
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("/");
  await expect(search(page)).toBeFocused();
  await search(page).fill("bir");
  await page.keyboard.press("/");
  await expect(search(page)).toHaveValue("bir/");
  await search(page).press("Escape");
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("Shift+/");
  // Real Turkish keyboards emit key='/' with shiftKey=true; exercise that event.
  await page.dispatchEvent("body", "keydown", { key: "/", shiftKey: true });
  await expect(search(page)).toBeFocused();
});

test("bookmark hint follows keyboard focus, is hoverable, and dismisses on Escape", async ({
  page,
}) => {
  await page.goto("/?subject=turkce");
  const button = save(page, "Sözcük Eşleri");
  await button.focus();
  const hint = page.getByRole("tooltip");
  await expect(hint).toHaveText("Bu tarayıcıda kaydet");
  await expect(button).toHaveAttribute(
    "aria-describedby",
    (await hint.getAttribute("id")) ?? "",
  );
  await page.keyboard.press("Escape");
  await expect(hint).toHaveCount(0);
  await button.hover();
  await expect(hint).toBeVisible();
  await hint.hover();
  await expect(hint).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(hint).toHaveCount(0);
});

test("failed cover keeps a readable fallback and loaded images respect reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/game-covers/demo-sozcuk-esleri.webp", (route) =>
    route.abort(),
  );
  await page.goto("/?subject=turkce");
  const card = page.locator(".game-card").filter({
    has: page.getByRole("heading", { name: "Sözcük Eşleri", exact: true }),
  });
  await expect(card.locator(".cover-empty")).toContainText(
    "Önizleme yüklenemedi",
  );
  await expect(card.locator(".card-art img")).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "Sözcük Eşleri", exact: true }),
  ).toBeVisible();
  const loaded = page.locator(".catalog-cover img").first();
  await expect(loaded).toBeVisible();
  expect(await loaded.evaluate((img) => img.getAnimations().length)).toBe(0);
});

test("small screens fit empty actions and undo, and long lists return focus to filters", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?subject=turkce");
    const link = page.getByRole("link", {
      name: "Filtrelere dön",
      exact: true,
    });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await link.press("Enter");
    await expect(
      page.getByRole("combobox", { name: "Sınıf", exact: true }),
    ).toBeFocused();
    await save(page, "Sözcük Eşleri").click();
    await save(page, "Sözcük Eşleri", true).click();
    await expect(page.locator(".saved-notice")).toBeVisible();
    const box = (await page.locator(".saved-notice").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `.impeccable/review/catalog-micro/undo-${width}.png`,
    });
    await page.getByRole("button", { name: "Bildirimi kapat" }).click();
    await page.goto("/?subject=turkce&q=uzay&grade=3");
    await expect(page.locator(".empty-actions a")).toHaveCount(3);
    for (const action of await page.locator(".empty-actions a").all()) {
      expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/catalog-micro/empty-${width}.png`,
    });
  }
});

test("catalogue without JavaScript (existing root streaming limitation)", async ({
  browser,
}) => {
  test.fail(
    true,
    "The existing root loading boundary streams the catalogue into a hidden React segment. Without JavaScript it stays on the loading state; see CATALOG-MICRO-TOUCHES-DELIVERY.md.",
  );
  const context = await browser.newContext({
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/?subject=turkce`);
  await expect(
    page.getByRole("heading", { name: "Türkçe oyunları" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-cover img").first()).toBeVisible();
  expect(
    await page
      .locator(".catalog-cover img")
      .first()
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(
    page.getByRole("link", { name: "Sözcük Eşleri", exact: true }),
  ).toBeVisible();
  await context.close();
});
