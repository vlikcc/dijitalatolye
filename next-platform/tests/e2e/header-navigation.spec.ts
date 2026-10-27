import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

test("guest navigation includes students, teachers and shared login", async ({
  page,
}) => {
  await page.goto("/ogretmenler-icin");
  await expect(page).toHaveURL(/\/nasil-kullanilir$/);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Ana menü", exact: true });
  await expect(
    nav.getByRole("link", { name: "Oyunlar", exact: true }),
  ).not.toHaveAttribute("aria-current", "page");
  await expect(
    nav.getByRole("link", { name: "Nasıl kullanılır?", exact: true }),
  ).toHaveAttribute("href", "/nasil-kullanilir");
  await nav
    .getByRole("link", { name: "Nasıl kullanılır?", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "birlikte keşfet",
  );
  await expect(
    nav.getByRole("link", { name: "Nasıl kullanılır?", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Öğrenciler için", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Öğretmenler için", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Oyunları keşfet", exact: true })
    .click();
  await expect(page).toHaveURL(/\/kesfet$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Her oyunda yeni bir keşif.",
  );
  await page.goto("/nasil-kullanilir");
  if (process.env.STUDENT_LEARNING_ENABLED === "true") {
    await page
      .getByRole("link", { name: "Öğrenci hesabı oluştur", exact: true })
      .click();
    await expect(page).toHaveURL(/\/kayit\?tur=ogrenci$/);
    await expect(
      page.getByRole("tab", { name: "Öğrenci", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("textbox", { name: "Sınıf kodu", exact: true }),
    ).toBeVisible();
    await page.goto("/nasil-kullanilir");
    await page
      .getByRole("link", { name: "Öğrenci girişi", exact: true })
      .click();
    await expect(page).toHaveURL(/\/giris\?next=%2Fogrenci$/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page
      .locator(".auth-links")
      .getByRole("link", { name: "Hesap oluştur", exact: true })
      .click();
    await expect(
      page.getByRole("tab", { name: "Öğrenci", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await page.goto("/nasil-kullanilir");
  } else {
    await expect(
      page.getByRole("link", { name: "Öğrenci hesabı oluştur", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Öğrenci girişi", exact: true }),
    ).toHaveCount(0);
  }
  await expect(
    page.getByRole("link", { name: "Öğretmen hesabı oluştur", exact: true }),
  ).toHaveAttribute("href", "/kayit?next=%2Fogretmen%2Fyeni");
  await page
    .getByRole("link", { name: "Paylaşmak için giriş yap", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Oyununu paylaşmak için giriş yap.",
  );
  await expect(page.locator('.auth-links a[href^="/kayit"]')).toHaveAttribute(
    "href",
    "/kayit?next=%2Fogretmen%2Fyeni",
  );
  await nav.getByRole("link", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Atölyeye hoş geldin.",
  );
  await nav.getByRole("link", { name: "Kaydettiklerim", exact: true }).click();
  await expect(page).toHaveURL(/\/kesfet\?saved=1$/);
  await expect(
    nav.getByRole("link", { name: "Kaydettiklerim", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("header and shared introduction fit narrow, tablet and desktop widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/nasil-kullanilir");
    const nav = page.getByRole("navigation", { name: "Ana menü", exact: true });
    if (width < 900) {
      const toggle = page.getByRole("button", {
        name: "Menüyü aç",
        exact: true,
      });
      await toggle.press("Enter");
      await expect(
        nav.getByRole("link", { name: "Oyunlar", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(nav).toBeHidden();
    } else {
      await expect(nav).toBeVisible();
      const logo = (await page.locator("header .brand").boundingBox())!;
      const menu = (await nav.boundingBox())!;
      expect(menu.x).toBeGreaterThanOrEqual(logo.x + logo.width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test.describe("authenticated header with isolated fixtures", () => {
  const database = process.env.HEADER_TEST_DATABASE_URL;
  test.skip(
    !database,
    "Requires an explicit local *_test database and matching app.",
  );
  let pool: Pool;
  const users: string[] = [];
  test.beforeAll(async ({ baseURL }) => {
    const db = new URL(database!);
    if (
      !["localhost", "127.0.0.1"].includes(db.hostname) ||
      !db.pathname.endsWith("_test") ||
      !["localhost", "127.0.0.1"].includes(new URL(baseURL!).hostname)
    )
      throw Error("Local isolated database required");
    pool = new Pool({ connectionString: database });
  });
  test.afterAll(async () => {
    if (!pool) return;
    if (users.length)
      await pool.query("DELETE FROM users WHERE id = ANY($1::text[])", [users]);
    await pool.end();
  });
  for (const role of ["teacher", "editor", "student", "admin"]) {
    test(`${role}: role links, keyboard dismissal, responsive menu and sign out`, async ({
      page,
      baseURL,
    }) => {
      const email = `header-${randomUUID()}@fixture.placeholder.invalid`;
      const password = `Header-${randomUUID()}`;
      const headers = { origin: baseURL! };
      const signup = await page.request.post("/api/auth/sign-up/email", {
        headers,
        data: { email, password, name: "Header test" },
      });
      expect(signup.ok()).toBe(true);
      const { rows } = await pool.query(
        "UPDATE users SET email_verified=true WHERE email=$1 RETURNING id",
        [email],
      );
      const id = rows[0].id;
      users.push(id);
      const login = await page.request.post("/api/auth/sign-in/email", {
        headers,
        data: { email, password },
      });
      expect(login.ok()).toBe(true);
      await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
      await page.goto("/");
      const header = page.locator("header");
      const trigger = header.getByRole("button", {
        name: role === "admin" ? "Yönetim" : "Atölyem",
        exact: true,
      });
      const panel = header.locator(".header-account-panel");
      const canCreate = role === "teacher" || role === "editor";
      await expect(
        header.getByRole("link", { name: "Oyun paylaş", exact: true }),
      ).toHaveCount(canCreate ? 1 : 0);
      for (const width of [1440, 900, 390]) {
        await page.setViewportSize({ width, height: 900 });
        if (width < 900)
          await page
            .getByRole("button", { name: "Menüyü aç", exact: true })
            .click();
        await trigger.press("Enter");
        await expect(panel.locator("a").first()).toBeFocused();
        await expect(
          panel.getByRole("link", { name: "Hesabım", exact: true }),
        ).toBeVisible();
        await expect(
          panel.getByRole("link", { name: "Oyun paylaş", exact: true }),
        ).toHaveCount(0);
        await expect(
          panel.getByRole("link", { name: "İnceleme kuyruğu", exact: true }),
        ).toHaveCount(role === "editor" ? 1 : 0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const box = (await panel.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        await page.keyboard.press("Escape");
        await expect(panel).toBeHidden();
        await expect(trigger).toBeFocused();
      }
      await page.goto("/nasil-kullanilir");
      await expect(
        page
          .locator("#ogretmenler")
          .getByRole("link", { name: "Oyun paylaş", exact: true }),
      ).toHaveCount(canCreate ? 1 : 0);
      await expect(
        page
          .locator("#ogrenciler")
          .getByRole("link", { name: "Öğrenci atölyeme git", exact: true }),
      ).toHaveCount(
        role === "student" && process.env.STUDENT_LEARNING_ENABLED === "true"
          ? 1
          : 0,
      );
      await page
        .getByRole("button", { name: "Menüyü aç", exact: true })
        .click();
      await trigger.click();
      await Promise.all([
        page.waitForEvent("load"),
        panel.getByRole("button", { name: "Çıkış yap", exact: true }).click(),
      ]);
      await expect(trigger).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Menüyü aç", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Menüyü aç", exact: true })
        .click();
      await expect(
        header.getByRole("link", { name: "Giriş yap", exact: true }),
      ).toBeVisible();
    });
  }
});
