import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const shots = ".impeccable/review/game-sharing";
test.beforeAll(async () => mkdir(shots, { recursive: true }));

test("sharing preserves the running game and prepares public links without sending messages", async ({
  page,
}) => {
  await page.goto(
    "/icerik/demo-sozcuk-esleri?from=%2Fkesfet%3Fq%3Dtest&oyna=1",
  );
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#progress-label")).toHaveText("Etkinlik 1 / 2");
  await page
    .locator("iframe")
    .evaluate((el) => (el.dataset.identity = "sharing-session"));
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) =>
          (document.documentElement.dataset.copied = text),
      },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        document.documentElement.dataset.shared = JSON.stringify(data);
        throw new DOMException("Cancelled", "AbortError");
      },
    });
  });
  const trigger = page.getByRole("button", { name: "Paylaş", exact: true });
  await trigger.click();
  const panel = page.getByRole("region", { name: "Paylaşım seçenekleri" });
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Bağlantıyı kopyala" }),
  ).toBeFocused();
  const publicUrl = new URL("/icerik/demo-sozcuk-esleri", page.url()).href;
  const whatsapp = new URL(
    (await panel
      .getByRole("link", { name: "WhatsApp’ta paylaş" })
      .getAttribute("href"))!,
  );
  expect(whatsapp.origin).toBe("https://wa.me");
  expect(whatsapp.searchParams.get("text")).toBe(
    `Sözcük Eşleri · Dijital Oyun Atölyesi\n${publicUrl}`,
  );
  const mail = new URL(
    (await panel
      .getByRole("link", { name: "E-postayla paylaş" })
      .getAttribute("href"))!,
  );
  expect(mail.protocol).toBe("mailto:");
  expect(mail.pathname).toBe("");
  expect(mail.searchParams.get("subject")).toBe("Sözcük Eşleri");
  expect(mail.searchParams.get("body")).toContain(publicUrl);
  expect(mail.searchParams.get("body")).not.toContain("from=");
  await panel.getByRole("button", { name: "Bağlantıyı kopyala" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-copied", publicUrl);
  await expect(panel.getByRole("status")).toHaveText(
    "Oyun bağlantısı panoya kopyalandı.",
  );
  await page.screenshot({ path: `${shots}/copied-native.png`, animations: "disabled" });
  await panel.getByRole("button", { name: "Diğer uygulamalar" }).click();
  const payload = JSON.parse(
    (await page.locator("html").getAttribute("data-shared"))!,
  );
  expect(payload).toEqual({
    title: "Sözcük Eşleri",
    text: "Sözcük Eşleri",
    url: publicUrl,
  });
  await expect(panel).toBeVisible();
  await expect(panel).not.toContainText("açılamadı");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator("iframe")).toHaveAttribute(
    "data-identity",
    "sharing-session",
  );
  await expect(frame.locator("#progress-label")).toHaveText("Etkinlik 1 / 2");
});

test("sharing fits small screens, supports keyboard exit and leaves a manual link when copying fails", async ({
  page,
}) => {
  await page.goto("/icerik/demo-sozcuk-esleri");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });
  const trigger = page.getByRole("button", { name: "Paylaş", exact: true });
  const panel = page.getByRole("region", { name: "Paylaşım seçenekleri" });
  for (const width of [320, 390, 768, 1450]) {
    await page.setViewportSize({ width, height: 900 });
    await trigger.click();
    await expect(
      panel.getByRole("button", { name: "Diğer uygulamalar" }),
    ).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const bounds = (await panel.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    for (const option of await panel.locator("button, a").all())
      expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: `${shots}/open-${width}.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Tab");
    await expect(
      panel.getByRole("link", { name: "WhatsApp’ta paylaş" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      panel.getByRole("link", { name: "E-postayla paylaş" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(panel).toBeHidden();
    await trigger.click();
    await panel.getByRole("button", { name: "Bağlantıyı kopyala" }).click();
    const input = panel.getByLabel("Paylaşım bağlantısı");
    await expect(input).toHaveValue(/\/icerik\/demo-sozcuk-esleri$/);
    await expect(input).toBeFocused();
    expect(
      await input.evaluate(
        (el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!,
      ),
    ).toBe((await input.inputValue()).length);
    await expect(panel.getByRole("status")).toContainText(
      "Otomatik kopyalanamadı",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${shots}/fallback-${width}.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
});
