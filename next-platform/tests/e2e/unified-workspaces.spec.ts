import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { Pool } from "pg";
import { randomUUID, createHmac } from "node:crypto";
import { mkdir } from "node:fs/promises";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const origin = process.env.APP_URL!;
const password = "Unified-local-test-" + randomUUID();
function totp(secret: string) {
  const bits = [...secret.toUpperCase().replace(/=/g, "")]
    .map((c) =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
        .indexOf(c)
        .toString(2)
        .padStart(5, "0"),
    )
    .join("");
  const key = Buffer.from(
    (bits.match(/.{8}/g) || []).map((b) => parseInt(b, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", key).update(counter).digest(),
    offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
async function post(api: APIRequestContext, path: string, data: unknown) {
  const response = await api.post(path, { headers: { origin }, data });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
async function verify(api: APIRequestContext, email: string) {
  let id = "";
  await expect
    .poll(async () => {
      const body = await (
        await fetch(
          "http://127.0.0.1:58025/api/v1/search?query=" +
            encodeURIComponent("to:" + email),
        )
      ).json();
      return (id = body.messages?.[0]?.ID || "");
    })
    .not.toBe("");
  const mail = await (
    await fetch("http://127.0.0.1:58025/api/v1/message/" + id)
  ).json();
  expect((await api.get(mail.Text.match(/https?:\/\/[^\s]+/)[0])).ok()).toBe(
    true,
  );
}
async function login(page: Page, identifier: string, next = "") {
  await page.goto("/giris" + (next ? "?next=" + encodeURIComponent(next) : ""));
  await page.getByLabel("E-posta veya kullanıcı adı").fill(identifier);
  await page.getByLabel("Parola", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
}
async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.brand-mark[data-entering="true"]')).toHaveCount(
    0,
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  for (const control of await page
    .locator(".menu-toggle, .nav a, .password-input button, .button-sm")
    .all()) {
    if (!(await control.isVisible())) continue;
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({
    path: ".impeccable/review/unified/" + name + ".png",
    fullPage: true,
  });
}
test.beforeAll(async () => {
  if (
    !origin ||
    !["localhost", "127.0.0.1"].includes(new URL(origin).hostname) ||
    !new URL(process.env.DATABASE_URL!).pathname.endsWith("_test")
  )
    throw Error("Dedicated local test database required");
  await mkdir(".impeccable/review/unified", { recursive: true });
});
test.afterAll(async () => pool.end());
test("shared sign-in, four role workspaces, server permissions and responsive navigation", async ({
  browser,
}) => {
  test.setTimeout(300000);
  const stamp = Date.now();
  const teacher = await browser.newContext(),
    tp = await teacher.newPage();
  const email = `unified-teacher-${stamp}@example.test`;
  await tp.goto("/kayit?next=%2Fogretmen%2Fyeni");
  await tp.getByLabel("Adınız ve soyadınız").fill("Deniz Öğretmen");
  await tp.getByLabel("E-posta adresi", { exact: true }).fill(email);
  await tp
    .getByRole("tabpanel", { name: "Öğretmen" })
    .getByLabel("Parola", { exact: true })
    .fill(password);
  await tp.getByRole("button", { name: "Hesap oluştur", exact: true }).click();
  await expect(tp.getByRole("status")).toContainText("Doğrulama bağlantısı");
  await verify(teacher.request, email);
  await login(tp, email, "/ogretmen/yeni");
  await expect(tp).toHaveURL(/\/ogretmen\/yeni$/);
  const cls = await post(teacher.request, "/api/learning/classes", {
    name: "Uzun adlı 4-A Matematik ve Keşif Sınıfı",
  });
  const student = await browser.newContext(),
    sp = await student.newPage(),
    username = "unified_" + stamp;
  await post(student.request, "/api/auth/student/register", {
    name: "Ada Öğrenci",
    username,
    classCode: cls.join_code,
    password,
  });
  await post(student.request, "/api/auth/sign-out", {});
  await login(sp, username);
  await expect(sp).toHaveURL(/\/ogrenci$/);
  await expect(sp.getByRole("heading", { level: 1 })).toHaveText("Ödevlerim");
  const accounts: {
    role: string;
    page: Page;
    home: string;
    heading: string;
  }[] = [
    { role: "teacher", page: tp, home: "/ogretmen", heading: "İçeriklerim" },
    { role: "student", page: sp, home: "/ogrenci", heading: "Ödevlerim" },
  ];
  for (const role of ["editor", "admin"]) {
    const context = await browser.newContext(),
      page = await context.newPage(),
      staffEmail = `unified-${role}-${stamp}@example.test`;
    await post(context.request, "/api/auth/sign-up/email", {
      name: role === "editor" ? "Ece Yönetici" : "Sistem Admin",
      email: staffEmail,
      password,
    });
    await verify(context.request, staffEmail);
    await pool.query("UPDATE users SET role=$2 WHERE email=$1", [
      staffEmail,
      role,
    ]);
    await post(context.request, "/api/auth/sign-in/email", {
      email: staffEmail,
      password,
    });
    await page.goto("/oturum");
    await expect(page).toHaveURL(/\/hesap$/);
    const setup = await post(context.request, "/api/auth/two-factor/enable", {
      password,
    });
    const secret = new URL(setup.totpURI).searchParams.get("secret")!;
    await post(context.request, "/api/auth/two-factor/verify-totp", {
      code: totp(secret),
    });
    await post(context.request, "/api/auth/sign-out", {});
    await login(page, staffEmail);
    await page.getByLabel("Doğrulama kodu", { exact: true }).fill(totp(secret));
    await page
      .getByRole("button", { name: "Kodu doğrula", exact: true })
      .click();
    await expect(page).toHaveURL(
      role === "editor" ? /\/editor$/ : /\/yonetim$/,
    );
    accounts.push({
      role,
      page,
      home: role === "editor" ? "/editor" : "/yonetim",
      heading: role === "editor" ? "İnceleme kuyruğu" : "Kullanıcılar",
    });
  }
  const admin = accounts.find((a) => a.role === "admin")!.page;
  const id = randomUUID();
  for (const [method, path] of [
    ["post", "/api/contents"],
    ["post", `/api/contents/${id}/versions`],
    ["post", `/api/contents/${id}/revisions`],
    ["put", `/api/versions/${id}/metadata`],
    ["put", `/api/versions/${id}/cover`],
    ["post", `/api/versions/${id}/submit`],
    ["post", `/api/versions/${id}/decision`],
    ["post", "/api/learning/classes"],
    ["post", "/api/learning/assignments"],
  ] as const) {
    const response = await admin.request[method](path, {
      headers: { origin },
      data: {},
    });
    expect(response.status(), path).toBe(403);
  }
  await admin.goto("/ogretmen/yeni");
  await expect(admin.getByText("Bu içerik burada değil.")).toBeVisible();
  await admin.goto("/giris?next=%2Fogretmen%2Fyeni");
  await admin.goto("/oturum?next=%2Fogretmen%2Fyeni");
  await expect(admin).toHaveURL(/\/yonetim$/);
  for (const account of accounts) {
    await account.page.goto(account.home);
    await expect(account.page.getByRole("heading", { level: 1 })).toHaveText(
      account.heading,
    );
    for (const width of [320, 390, 600, 768, 1024, 1440]) {
      await account.page.setViewportSize({ width, height: 900 });
      expect(
        await account.page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${account.role} ${width}`,
      ).toBe(true);
      if (width < 1100) {
        if (width < 900)
          await account.page.getByRole("button", { name: "Menüyü aç" }).click();
        const accountToggle = account.page.locator(".header-account-toggle");
        await accountToggle.click();
        await expect(
          account.page.locator('.header-account-links a[aria-current="page"]'),
        ).toBeVisible();
        await account.page.keyboard.press("Escape");
        await expect(accountToggle).toBeFocused();
        if (width < 900) {
          await account.page.keyboard.press("Escape");
          await expect(
            account.page.getByRole("button", { name: "Menüyü aç" }),
          ).toBeFocused();
        }
      } else
        await expect(
          account.page.locator('.sidebar a[aria-current="page"]'),
        ).toBeVisible();
      if (width === 390 || width === 1440)
        await capture(account.page, `${account.role}-${width}`);
    }
    // 200% desktop zoom's reflow equivalent, plus larger text.
    await account.page.setViewportSize({ width: 720, height: 450 });
    await account.page.evaluate(
      () => (document.documentElement.style.zoom = "2"),
    );
    expect(
      await account.page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await account.page.evaluate(
      () => (document.documentElement.style.zoom = ""),
    );
    await account.page.goto("/");
    await expect(account.page.locator(".catalog-share")).toHaveCount(
      ["student", "admin"].includes(account.role) ? 0 : 1,
    );
    await account.page.goto("/hesap");
    await expect(account.page.locator(".catalog-share")).toHaveCount(0);
  }
  // Sections load separately and preserve meaningful empty states.
  for (const section of ["tanimlar", "yayinlar", "sistem", "kayitlar"]) {
    await admin.goto("/yonetim?bolum=" + section);
    await admin.setViewportSize({ width: 390, height: 844 });
    await expect(admin.locator(".list-toolbar")).toBeVisible();
    expect(
      await admin.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await capture(admin, "admin-" + section + "-390");
  }
  await admin.goto("/yonetim?q=UNMATCHED-RECORD");
  await expect(
    admin.getByRole("heading", { name: "Eşleşen kayıt yok." }),
  ).toBeVisible();
  await sp.goto("/ogrenci?bolum=siniflar");
  await expect(sp.getByText("Öğretmen onayı bekleniyor")).toBeVisible();
  await capture(sp, "student-classes");
  await sp.goto("/ogrenci?bolum=oyunlar");
  await expect(sp.getByRole("heading", { level: 1 })).toHaveText("Oyunlarım");
  const studentId = (
    await pool.query("SELECT user_id FROM student_profiles WHERE username=$1", [
      username,
    ])
  ).rows[0].user_id;
  const recovery = await post(
    admin.request,
    `/api/learning/recovery/${studentId}`,
    { takeover: true },
  );
  expect(recovery.code).toBeTruthy();
  expect(
    (
      await teacher.request.post(`/api/learning/recovery/${studentId}`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const prefix = "Pagination-" + stamp;
  await pool.query(
    "INSERT INTO users(id,name,email) SELECT $1||i,$1||lpad(i::text,2,'0'),$1||i||'@example.test' FROM generate_series(1,27) i",
    [prefix],
  );
  await admin.goto("/yonetim?q=" + prefix);
  await expect(admin.locator(".content-row")).toHaveCount(25);
  await admin.getByRole("link", { name: "Sonraki", exact: true }).click();
  await expect(admin.locator(".content-row")).toHaveCount(2);
  await expect(admin.locator(".pagination")).toContainText(
    "27 kayıt · Sayfa 2 / 2",
  );
  await admin.getByRole("button", { name: "Menüyü aç" }).click();
  await admin.locator(".header-account-toggle").click();
  await expect(
    admin.locator('.header-account-links a[aria-current="page"]'),
  ).toHaveText("Kullanıcılar");
  await admin.keyboard.press("Escape");
  await pool.query("DELETE FROM users WHERE id LIKE $1", [prefix + "%"]);
  for (const account of accounts) await account.page.context().close();
});
test("legacy links, registration keyboard tabs, password visibility and delayed errors preserve fields", async ({
  page,
}) => {
  await page.goto("/ogrenci/giris?next=%2Fogrenci%3Fbolum%3Doyunlar");
  await expect(page).toHaveURL(/\/giris\?next=/);
  await page.goto("/ogrenci/kayit?next=%2Fogrenci");
  await expect(page.getByRole("tab", { name: "Öğrenci" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const pupil = page.getByRole("tabpanel", { name: "Öğrenci" });
  await pupil.getByLabel("Görünen adın").fill("Çağrı Işık");
  await pupil.getByLabel("Kullanıcı adı", { exact: true }).fill("cagri_isik");
  await expect(page.getByRole("tab", { name: "Öğrenci" })).toBeEnabled();
  await page.getByRole("tab", { name: "Öğrenci" }).press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "Öğretmen" })).toBeFocused();
  await page.getByRole("tab", { name: "Öğretmen" }).press("End");
  await expect(pupil.getByLabel("Görünen adın")).toHaveValue("Çağrı Işık");
  await pupil.getByLabel("Parola", { exact: true }).fill(password);
  await pupil.getByRole("button", { name: "Parolayı göster" }).click();
  await expect(pupil.getByLabel("Parola", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await pupil.getByRole("button", { name: "Parolayı gizle" }).click();
  for (const width of [320, 390, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if ([390, 1440].includes(width))
      await capture(page, `registration-${width}`);
  }
  await page.goto("/giris");
  let submissions = 0;
  await page.route("**/api/auth/sign-in/email", async (route) => {
    submissions++;
    await new Promise((r) => setTimeout(r, 400));
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid",
      }),
    });
  });
  await page
    .getByLabel("E-posta veya kullanıcı adı")
    .fill("wrong@example.test");
  await page.getByLabel("Parola", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).dblclick();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(submissions).toBe(1);
  await expect(page.getByLabel("E-posta veya kullanıcı adı")).toHaveValue(
    "wrong@example.test",
  );
  await capture(page, "login-error");
});

test("verification resend and password recovery preserve the upload return destination", async ({
  page,
}) => {
  const email = `recover-${Date.now()}@example.test`;
  await post(page.request, "/api/auth/sign-up/email", {
    name: "Kurtarma Testi",
    email,
    password,
  });
  await login(page, email, "/ogretmen/yeni");
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "E-posta adresinizi doğrulayın",
  );
  await page
    .getByRole("button", { name: "Doğrulama bağlantısını yeniden gönder" })
    .click();
  await expect(page.getByRole("status")).toContainText("yeni bağlantı");
  await verify(page.request, email);
  await page.goto("/parolami-unuttum?next=%2Fogretmen%2Fyeni");
  await page.getByLabel("E-posta adresi", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Yenileme bağlantısı gönder" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "yenileme bağlantısı gönderildi",
  );
  let reset = "";
  await expect
    .poll(async () => {
      const mails = await (
        await fetch(
          "http://127.0.0.1:58025/api/v1/search?query=" +
            encodeURIComponent("to:" + email),
        )
      ).json();
      for (const summary of mails.messages ?? []) {
        const mail = await (
          await fetch("http://127.0.0.1:58025/api/v1/message/" + summary.ID)
        ).json();
        const url = mail.Text.match(/https?:\/\/[^\s]+/)?.[0];
        if (url?.includes("reset-password")) return (reset = url);
      }
      return "";
    })
    .not.toBe("");
  await page.goto(reset);
  await expect(page).toHaveURL(/parola-yenile/);
  const updated = password + "-new";
  await page.getByLabel("Parola", { exact: true }).fill(updated);
  await page.getByRole("button", { name: "Parolayı güncelle" }).click();
  await expect(page.getByRole("status")).toContainText("Parolan güncellendi");
  await page
    .locator(".auth-links")
    .getByRole("link", { name: "Giriş yap" })
    .click();
  await expect(page).toHaveURL(/next=%2Fogretmen%2Fyeni/);
  await page.getByLabel("E-posta veya kullanıcı adı").fill(email);
  await page.getByLabel("Parola", { exact: true }).fill(updated);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page).toHaveURL(/ogretmen\/yeni$/);
});
