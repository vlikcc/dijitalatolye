import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { Pool } from "pg";
import { randomBytes, createHmac } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
const origin = process.env.APP_URL || "http://localhost:3100";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const password = "Local-learning-" + randomBytes(12).toString("hex");
function totp(secret: string) {
  let bits = "";
  for (const ch of secret.toUpperCase().replace(/=/g, ""))
    bits += "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
      .indexOf(ch)
      .toString(2)
      .padStart(5, "0");
  const bytes = Buffer.from(
    (bits.match(/.{8}/g) || []).map((b) => parseInt(b, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", bytes).update(counter).digest();
  return ((hash.readUInt32BE(hash[19] & 15) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
async function post(api: APIRequestContext, path: string, data: unknown) {
  const r = await api.post(path, { headers: { origin }, data });
  expect(r.ok(), `${path}: ${await r.text()}`).toBeTruthy();
  return r.json();
}
async function register(api: APIRequestContext, email: string, name: string) {
  await post(api, "/api/auth/sign-up/email", {
    email,
    name,
    password,
    callbackURL: "/giris",
  });
  let id = "";
  await expect
    .poll(async () => {
      const mail = await (
        await fetch(
          `http://127.0.0.1:58025/api/v1/search?query=${encodeURIComponent("to:" + email)}`,
        )
      ).json();
      id = mail.messages?.[0]?.ID;
      return id;
    })
    .toBeTruthy();
  const mail = await (
    await fetch(`http://127.0.0.1:58025/api/v1/message/${id}`)
  ).json();
  expect(
    (await api.get(mail.Text.match(/https?:\/\/[^\s]+/)[0])).ok(),
  ).toBeTruthy();
}
async function capture(page: Page, name: string) {
  await expect(
    page.getByText("Atölye hazırlanıyor…", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('.brand-mark[data-entering="true"]')).toHaveCount(
    0,
  );
  await mkdir(".impeccable/review", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      // Let the active player's resize/focus scroll complete before positioning
      // the document for full-page evidence.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/learning-${name}-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}
test.skip(
  process.env.STUDENT_LEARNING_ENABLED !== "true",
  "Student learning pilot is disabled.",
);
test.beforeAll(() => {
  if (
    !["localhost", "127.0.0.1"].includes(new URL(origin).hostname) ||
    !new URL(process.env.DATABASE_URL!).pathname.endsWith("_test")
  )
    throw Error("Local dedicated *_test database required.");
});
test.afterAll(async () => pool.end());
test("student registration, real published pilots, checkpoint replay, cross-device resume and teacher reports", async ({
  browser,
  page,
}) => {
  test.setTimeout(360000);
  const stamp = Date.now();
  const teacherEmail = `learning-teacher-${stamp}@example.test`;
  await register(page.request, teacherEmail, "Pilot Öğretmen");
  await post(page.request, "/api/auth/sign-in/email", {
    email: teacherEmail,
    password,
  });
  const editor = await browser.newContext();
  const editorApi = editor.request;
  const editorEmail = `learning-editor-${stamp}@example.test`;
  await register(editorApi, editorEmail, "Pilot Editör");
  await pool.query("UPDATE users SET role='editor' WHERE email=$1", [
    editorEmail,
  ]);
  await post(editorApi, "/api/auth/sign-in/email", {
    email: editorEmail,
    password,
  });
  const setup = await post(editorApi, "/api/auth/two-factor/enable", {
    password,
  });
  await post(editorApi, "/api/auth/two-factor/verify-totp", {
    code: totp(new URL(setup.totpURI).searchParams.get("secret")!),
  });
  const subject = (
    await pool.query("SELECT id FROM taxonomy WHERE label='Matematik' LIMIT 1")
  ).rows[0].id;
  const published: Record<
    string,
    { id: string; versionId: string; slug: string }
  > = {};
  for (const kind of ["choice", "match", "order", "sort"]) {
    const authorApi = kind === "sort" ? editorApi : page.request;
    const c = await post(authorApi, "/api/contents", {
      title: `Pilot ${kind}`,
    });
    const upload = await authorApi.post(`/api/contents/${c.id}/versions`, {
      headers: { origin },
      multipart: {
        archive: {
          name: `${kind}.zip`,
          mimeType: "application/zip",
          buffer: await readFile(`fixtures/learning/${kind}.zip`),
        },
      },
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    const { versionId } = await upload.json();
    published[kind] = { id: c.id, versionId, slug: "" };
    const version = async () =>
      (await (await authorApi.get(`/api/contents/${c.id}`)).json()).versions[0];
    await expect
      .poll(
        async () => {
          const v = await version();
          if (["rejected", "scan_error"].includes(v.state))
            throw Error(v.error);
          return v.state;
        },
        { timeout: 120000 },
      )
      .toBe("needs_metadata");
    let v = await version();
    expect(v.tracking).toBe(true);
    expect(v.scanReport.status).toBe("clean");
    const manifest = JSON.parse(
      await readFile(`fixtures/learning/${kind}/dijitalatolye.json`, "utf8"),
    );
    const metadata = {
      title: manifest.title,
      description: manifest.description,
      grade: manifest.grade,
      subjectId: subject,
      outcomeIds: [],
    };
    const saved = await authorApi.put(`/api/versions/${versionId}/metadata`, {
      headers: { origin },
      data: { sha256: v.sha256, revision: v.metadataRevision, metadata },
    });
    expect(saved.ok(), await saved.text()).toBe(true);
    await expect
      .poll(
        async () => {
          v = await version();
          return v.cover.status;
        },
        { timeout: 60000 },
      )
      .toBe("ready");
    await post(authorApi, `/api/versions/${versionId}/submit`, {
      sha256: v.sha256,
      revision: v.metadataRevision,
      metadata,
    });
    v = await version();
    const item = {
      status: "suitable",
      note: "Yerel pilot testi için örnek etkinlik incelendi.",
    };
    const warnings = [
      ...new Set(
        v.technicalReport.findings
          .filter((f: any) => f.severity === "warning")
          .map((f: any) => f.rule),
      ),
    ].map((rule) => ({
      rule,
      disposition: "accepted_limitation",
      note: "Yerel pilot testi; statik kapsam sınırı kabul edildi.",
    }));
    await post(editorApi, `/api/versions/${versionId}/decision`, {
      sha256: v.sha256,
      revision: v.metadataRevision,
      decision: "approve",
      note: "Yerel test pilotu incelemesi tamamlandı.",
      review: {
        technicalReportId: v.technicalReport.id,
        coverId: v.cover.artifact.id,
        assessment: {
          science: item,
          age: item,
          education: item,
          accessibility: item,
          cover: item,
          outcomes: [],
          warnings,
        },
      },
    });
    await expect
      .poll(async () => (await version()).state, { timeout: 60000 })
      .toBe("published");
    published[kind].slug = (
      await pool.query("SELECT slug FROM contents WHERE id=$1", [c.id])
    ).rows[0].slug;
  }
  // Teacher uses the real class form; student self-registers through the UI.
  await page.goto("/ogretmen/siniflar");
  await page.getByLabel("Sınıf adı", { exact: true }).fill("4-A Keşif Sınıfı");
  await page.getByRole("button", { name: "Sınıf oluştur" }).click();
  await expect(
    page.getByRole("heading", { name: "4-A Keşif Sınıfı" }),
  ).toBeVisible();
  const data = await (await page.request.get("/api/learning/teacher")).json();
  const cls = data.classes[0];
  const student = await browser.newContext();
  const sp = await student.newPage();
  const username = `pilot_${stamp}`;
  await sp.goto("/ogrenci/kayit");
  await expect(
    sp
      .getByRole("navigation", { name: "Ana menü" })
      .getByRole("link", { name: "Giriş yap", exact: true }),
  ).toBeVisible();
  await sp.getByLabel("Görünen adın").fill("Deniz Pilot");
  await sp.getByLabel("Kullanıcı adı", { exact: true }).fill(username);
  await sp.getByLabel("Sınıf kodu", { exact: true }).fill(cls.join_code);
  await sp
    .getByRole("tabpanel", { name: "Öğrenci" })
    .getByLabel("Parola", { exact: true })
    .fill(password);
  await sp.route("**/api/auth/student/register", (route) =>
    route.abort("failed"),
  );
  await sp.getByRole("button", { name: "Hesabımı oluştur" }).click();
  await expect(sp.locator("form").getByRole("alert")).toContainText(
    "Sunucuya ulaşılamadı",
  );
  await expect(sp.getByLabel("Kullanıcı adı", { exact: true })).toHaveValue(
    username,
  );
  await capture(sp, "auth-error");
  await sp.unroute("**/api/auth/student/register");
  await sp.route("**/api/auth/student/register", (route) =>
    route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "Temporary error",
    }),
  );
  await sp.getByRole("button", { name: "Hesabımı oluştur" }).click();
  await expect(sp.locator("form").getByRole("alert")).toContainText(
    "Sunucudan geçerli bir yanıt alınamadı",
  );
  await sp.unroute("**/api/auth/student/register");
  await sp.getByRole("button", { name: "Hesabımı oluştur" }).click();
  await expect(sp).toHaveURL(/\/ogrenci$/);
  await sp.goto("/ogrenci?bolum=siniflar");
  await expect(sp.getByText(/Öğretmen onayı bekleniyor/)).toBeVisible();
  await expect(
    sp.locator("header").getByRole("link", { name: "Oyun paylaş", exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await sp.request.post("/api/contents", {
        headers: { origin },
        data: { title: "Forbidden" },
      })
    ).status(),
  ).toBe(403);
  await page.reload();
  await page.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(page.getByText(`${username} · Onaylı`)).toBeVisible();
  const studentId = (
    await pool.query("SELECT user_id FROM student_profiles WHERE username=$1", [
      username,
    ])
  ).rows[0].user_id;
  await capture(page, "classes");
  await page.goto(`/ogretmen/odevler?oyun=${published.choice.id}`);
  await page
    .getByLabel("Ödev başlığı", { exact: true })
    .fill("Kesirleri keşfedelim");
  await page
    .getByLabel("Yönerge", { exact: true })
    .fill("Soruları kendi hızında tamamla.");
  await page.getByLabel(/Sınıfın tüm onaylı öğrencileri/).uncheck();
  await page.getByLabel("Deniz Pilot", { exact: true }).check();
  await capture(page, "assignment");
  await page.getByRole("button", { name: "Ödevi ver", exact: true }).click();
  await expect(page).toHaveURL(/\/ogretmen\/odevler\/[a-f0-9-]+$/);
  const assignment = { id: new URL(page.url()).pathname.split("/").at(-1)! };
  await sp.goto("/ogrenci");
  await capture(sp, "student");
  await sp.getByRole("link", { name: "Ödeve başla" }).click();
  const frame = sp.frameLocator("iframe");
  await expect(
    frame.getByRole("button", { name: "3/8", exact: true }),
  ).toBeVisible();
  let lostResponse = false;
  await sp.route("**/api/learning/play/*", async (route) => {
    if (!lostResponse) {
      lostResponse = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await frame.getByRole("button", { name: "3/8", exact: true }).click();
  await expect(sp.getByText("Kaydedildi.", { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await frame.getByRole("button", { name: "Sonraki etkinlik" }).click();
  await expect(sp.getByText("Kaydedildi.", { exact: true })).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await pool.query(
            "SELECT revision FROM game_attempts WHERE assignment_id=$1 AND student_id=$2",
            [assignment.id, studentId],
          )
        ).rows[0].revision,
    )
    .toBe(2);
  // New browser context represents another device with no shared storage.
  const second = await browser.newContext();
  const resumed = await second.newPage();
  await post(second.request, "/api/auth/student/login", { username, password });
  await resumed.goto(
    `/ogrenci/oyna/${published.choice.id}?odev=${assignment.id}`,
  );
  const rf = resumed.frameLocator("iframe");
  await expect(
    rf.getByRole("button", { name: "4 dilim", exact: true }),
  ).toBeVisible();
  await expect(resumed.locator(".player-loading")).toHaveCount(0);
  await rf.locator("body").evaluate(() => document.fonts.ready);
  await rf.getByRole("button", { name: "4 dilim", exact: true }).press("Enter");
  await rf.getByRole("button", { name: "Sonraki etkinlik" }).click();
  await rf.getByRole("button", { name: "1/2", exact: true }).click();
  await rf.getByRole("button", { name: "Sonucu gör" }).click();
  await expect(resumed.getByText("Tamamlandı ve kaydedildi.")).toBeVisible();
  // An old device must not overwrite the completed checkpoint.
  await frame.getByRole("button", { name: "4 dilim", exact: true }).click();
  await expect(
    sp.getByText(/Oyun başka bir sekmede veya cihazda değişti/).first(),
  ).toBeVisible();
  await page.goto(`/ogretmen/odevler/${assignment.id}`);
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(
    page.getByRole("cell", { name: "Tamamlandı", exact: true }),
  ).toBeVisible();
  await capture(page, "report");
  await expect(page.getByRole("table")).toHaveCount(0);
  const mobileResult = page
    .locator(".report-mobile li")
    .filter({ hasText: "Deniz Pilot" });
  await expect(
    mobileResult.getByText("Tamamlandı", { exact: true }),
  ).toBeVisible();
  await mobileResult.locator("summary").click();
  await expect(
    mobileResult.getByText("En iyi puan", { exact: true }),
  ).toBeVisible();
  // Other mechanics restore selections inside an unfinished round.
  for (const kind of ["match", "order", "sort"]) {
    await resumed.goto(
      `/icerik/${published[kind].slug}${kind === "sort" ? "?oyna=1" : ""}`,
    );
    if (kind !== "sort")
      await resumed
        .getByRole("button", {
          name: "Oyuna başla",
          exact: true,
        })
        .click();
    await expect(resumed).toHaveURL(
      new RegExp(`/ogrenci/oyna/${published[kind].id}$`),
    );
    const f = resumed.frameLocator("iframe");
    await expect(resumed.locator(".player-loading")).toHaveCount(0);
    await f.locator("body").evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await resumed.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    if (kind === "match") {
      await f.getByRole("button", { name: "Yanıt", exact: true }).click();
      await f.getByRole("button", { name: "Cevap", exact: true }).click();
    }
    if (kind === "order")
      await f.getByRole("button", { name: "Merkür", exact: true }).click();
    if (kind === "sort") await f.locator(".sort-pool button").first().click();
    await expect
      .poll(
        async () =>
          (
            await pool.query(
              "SELECT revision FROM game_attempts WHERE student_id=$1 AND version_id=$2 AND assignment_id IS NULL ORDER BY created_at DESC LIMIT 1",
              [studentId, published[kind].versionId],
            )
          ).rows[0]?.revision,
      )
      .toBe(kind === "match" ? 2 : 1);
    await expect(
      resumed.getByText("Kaydedildi.", { exact: true }),
    ).toBeVisible();
    await resumed.reload();
    if (kind === "match")
      await expect(
        f.getByRole("button", { name: "Yanıt", exact: true }),
      ).toBeDisabled();
    if (kind === "order")
      await expect(
        f.getByRole("button", { name: "1. Merkür", exact: true }),
      ).toBeVisible();
    if (kind === "sort")
      await expect(f.locator(".sort-pool button").first()).toHaveAttribute(
        "aria-pressed",
        "true",
      );
  }
  await capture(resumed, "player");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ödevi kapat", exact: true }).click();
  await expect(
    page
      .locator(".report-mobile")
      .getByText("Tamamlandı · Kapalı", { exact: true }),
  ).toBeVisible();
  await sp.goto("/ogrenci");
  await expect(
    sp.getByText("Tamamlandı · Kapalı", { exact: true }),
  ).toBeVisible();
  await expect(
    sp.getByText(/Oyunun bildirdiği son sonuç: ilerleme %100 · puan 100/),
  ).toBeVisible();
  await expect(
    sp.getByRole("link", { name: "Sonucu gör", exact: true }),
  ).toHaveCount(0);
  const recovery = await post(
    page.request,
    `/api/learning/recovery/${studentId}`,
    {},
  );
  await post(student.request, "/api/auth/student/reset", {
    username,
    code: recovery.code,
    password: password + "new",
  });
  expect((await second.request.get("/api/learning/student")).status()).toBe(
    401,
  );
  await student.close();
  await second.close();
  await editor.close();
});
