import { test, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir } from "node:fs/promises";
import { GameInformation } from "../../src/components/game-information";
import { demoGames } from "../../src/games/demos";
import type { CatalogGame } from "../../src/lib/catalog-model";

const shots = ".impeccable/review/21st-frontend/after";
test.beforeAll(async () => {
  await mkdir(shots, { recursive: true });
});

test("catalogue introduction stays compact and text-only at every breakpoint", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.brand-mark[data-entering="true"]')).toHaveCount(
    0,
  );
  for (const width of [320, 390, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    await expect(page.locator(".discovery-intro img")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440)
      for (const card of (await page.locator(".game-card").all()).slice(0, 4)) {
        const box = (await card.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual(900);
      }
    if (width === 390) {
      const box = (await page.locator(".game-card h3").first().boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(844);
    }
    await page.screenshot({
      path: `${shots}/catalogue-${width}.png`,
      animations: "disabled",
    });
  }
  for (const query of [
    "?grade=4",
    "?subject=matematik",
    "?q=gezegen",
    "?saved=1",
    "?q=zzzxqvnoresult987654",
  ]) {
    await page.goto("/" + query);
    await expect(page.locator(".discovery-intro img")).toHaveCount(0);
  }
  await expect(
    page.getByRole("heading", { name: "Henüz bir eşleşme yok" }),
  ).toBeVisible();
});

test("account artwork reflows and registration feedback follows the real password rule without losing drafts", async ({
  page,
}) => {
  for (const [name, route] of [
    ["login", "/giris"],
    ["register-teacher", "/kayit"],
    ["register", "/kayit?tur=ogrenci"],
  ]) {
    await page.goto(route);
    // Wait for hydration before screenshots manipulate input caret styles.
    if (route.startsWith("/kayit"))
      await expect(
        page.getByRole("tab", { name: "Öğrenci", exact: true }),
      ).toBeEnabled();
    else
      await expect(
        page.getByRole("button", { name: "Giriş yap", exact: true }),
      ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.brand-mark[data-entering="true"]')).toHaveCount(
      0,
    );
    await expect(page.locator(".login-game-cover")).toHaveCount(3);
    for (const width of [320, 390, 600, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
      await expect(page.locator(".account-introduction")).toBeVisible({
        visible: width >= 1024,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${shots}/${name}-${width}.png`,
        animations: "disabled",
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const student = page.getByRole("tabpanel", { name: "Öğrenci", exact: true });
  await student.getByLabel("Görünen adın").fill("Çağrı Işık");
  await student.getByLabel("Kullanıcı adı", { exact: true }).fill("cagri_isik");
  await expect(
    student.getByLabel("Sınıf kodu", { exact: true }),
  ).toHaveAccessibleDescription("Öğretmeninden aldığın sınıf kodu.");
  for (const role of ["Öğrenci", "Öğretmen"]) {
    await page.getByRole("tab", { name: role, exact: true }).click();
    const panel = page.getByRole("tabpanel", { name: role, exact: true });
    const password = panel.getByLabel("Parola", { exact: true });
    const help = panel.locator(".password-requirement");
    await password.fill("a".repeat(11));
    await expect(help).toHaveText("En az 12 karakter.");
    expect(
      await password.evaluate(
        (input: HTMLInputElement) => input.validity.tooShort,
      ),
    ).toBe(true);
    await password.fill("a".repeat(12));
    await expect(help).toHaveText("En az 12 karakter koşulu sağlandı.");
    expect(
      await password.evaluate((input: HTMLInputElement) =>
        input.checkValidity(),
      ),
    ).toBe(true);
    await password.fill("a".repeat(128));
    expect((await password.inputValue()).length).toBe(128);
    await password.fill("");
    await expect(help).toHaveText("En az 12 karakter.");
  }
  await page.getByRole("tab", { name: "Öğrenci", exact: true }).click();
  await expect(student.getByLabel("Görünen adın")).toHaveValue("Çağrı Işık");
  await page.goto("/giris");
  await expect(page.locator(".password-requirement")).toHaveCount(0);
  await page.goto("/parola-yenile");
  await expect(page.locator(".password-requirement")).toHaveText(
    "En az 12 karakter.",
  );
  await page.getByLabel("Parola", { exact: true }).fill("a".repeat(12));
  await expect(page.locator(".password-requirement")).toHaveText(
    "En az 12 karakter koşulu sağlandı.",
  );
});

test("additional note disclosure keeps the active iframe, and long content and zoom remain usable", async ({
  page,
}) => {
  await page.goto("/icerik/demo-kesir-mutfagi");
  await page.getByRole("button", { name: "Oyuna başla", exact: true }).click();
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
  const originalIframe = await page.locator("iframe").elementHandle();
  const game: CatalogGame = {
    id: "note-fixture",
    slug: demoGames[0].slug,
    title: "Yerel arayüz test verisi",
    description: "",
    subject: "Matematik",
    subjectKey: "matematik",
    grade: 4,
    kind: "demo",
    author: "Test öğretmeni",
    objectives: ["İlk öğrenme hedefi."],
    teacherNotes: [
      "İlk not görünür kalır.",
      "UzunTürkçeAçıklama".repeat(30),
      "Son not.",
    ],
  };
  // The server component has no client state. Use its actual rendered HTML to
  // exercise multi-note content while the real bundled game continues running.
  const html = renderToStaticMarkup(createElement(GameInformation, { game }));
  await page
    .locator(".game-information")
    .evaluate((element, html) => (element.outerHTML = html), html);
  const notes = page.locator(".game-note-disclosure");
  await expect(page.getByText("İlk not görünür kalır.")).toBeVisible();
  await expect(page.getByText("Son not.")).toBeHidden();
  const summary = notes.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(page.getByText("Son not.")).toBeVisible();
  expect(
    await originalIframe!.evaluate(
      (el) => el === document.querySelector("iframe"),
    ),
  ).toBe(true);
  await expect(frame.locator("#progress-label")).toHaveText("Etkinlik 1 / 3");
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await notes.screenshot({ path: `${shots}/additional-notes-fixture.png` });
  await summary.press("Enter");
  await expect(page.getByText("Son not.")).toBeHidden();
  await page.goto("/");
  await page
    .locator(".game-card h3 a span")
    .first()
    .evaluate(
      (el) =>
        (el.textContent = "KesirlerleÖğrenmeninÇokUzunTürkçeBaşlığı".repeat(8)),
    );
  await page
    .locator(".game-card p")
    .first()
    .evaluate((el) => (el.textContent = "Uzun açıklama. ".repeat(45)));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(
    await page
      .locator(".game-card")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  for (const route of [
    "/",
    "/giris",
    "/kayit?tur=ogrenci",
    "/icerik/demo-kesir-mutfagi",
  ]) {
    await page.goto(route);
    await expect(
      page
        .locator(
          route === "/"
            ? ".game-card"
            : route.includes("icerik")
              ? ".game-detail"
              : ".auth-box",
        )
        .first(),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.setViewportSize({ width: 780, height: 1688 });
    await page.evaluate(() => (document.documentElement.style.zoom = "2"));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${shots}/zoom-${route.includes("icerik") ? "game" : route.includes("kayit") ? "register" : route.includes("giris") ? "login" : "home"}.png`,
      animations: "disabled",
    });
  }
});
