import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { randomBytes, createHmac } from "node:crypto";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { ZipFile } from "yazl";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const password = "Local-test-" + randomBytes(12).toString("hex");
const origin = process.env.APP_URL || "http://localhost:3000";
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
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
async function register(api: APIRequestContext, email: string, name: string) {
  const r = await api.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: { name, email, password, callbackURL: "/giris" },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  let messageId = "";
  await expect
    .poll(async () => {
      const res = await fetch(
        `http://127.0.0.1:58025/api/v1/search?query=${encodeURIComponent("to:" + email)}`,
      );
      const b = await res.json();
      messageId = b.messages?.[0]?.ID || "";
      return messageId;
    })
    .not.toBe("");
  const mail = await (
    await fetch(`http://127.0.0.1:58025/api/v1/message/${messageId}`)
  ).json();
  const url = mail.Text.match(/https?:\/\/[^\s]+/)[0];
  const verified = await api.get(url);
  expect(verified.ok()).toBeTruthy();
}
async function signIn(api: APIRequestContext, email: string) {
  const r = await api.post("/api/auth/sign-in/email", {
    headers: { origin },
    data: { email, password },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  return r.json();
}
function reviewPayload(v: any, excluded: string[] = []) {
  const item = { status: "suitable", note: "TEST ONLY: fixture reviewed." };
  return {
    technicalReportId: v.technicalReport.id,
    coverId: v.cover.artifact.id,
    assessment: {
      science: item,
      age: item,
      education: item,
      accessibility: item,
      cover: item,
      warnings: [
        ...new Set(
          v.technicalReport.findings
            .filter((f: any) => f.severity === "warning")
            .map((f: any) => f.rule),
        ),
      ].map((rule) => ({
        rule,
        disposition: "accepted_limitation",
        note: "TEST ONLY: fixture limitation.",
      })),
      outcomes: (v.metadata.outcomeRefs ?? []).map((o: any) => ({
        ...o,
        status: excluded.includes(o.outcomeId) ? "exclude" : "suitable",
        note: "TEST ONLY: fixture outcome evidence.",
      })),
    },
  };
}
async function fillEditorialForm(page: import("@playwright/test").Page) {
  for (const key of ["science", "age", "education", "accessibility", "cover"]) {
    await page.locator(`[name="assessment.${key}"]`).selectOption("suitable");
    await page
      .locator(`[name="note.${key}"]`)
      .fill("Demo önizlemede incelendi; sınıf içi kullanım için uygun.");
  }
  for (const control of await page.locator('select[name^="warning."]').all())
    await control.selectOption("accepted_limitation");
  for (const field of await page
    .locator('textarea[name^="warning-note."]')
    .all())
    await field.fill("Demo önizlemede kontrol edildi; sınırlılık kaydedildi.");
  for (const field of await page
    .locator('textarea[name^="outcome-note."]')
    .all())
    await field.fill("Kaynak doğrulanmadığı için kazanım ilişkisi çıkarıldı.");
}
test.beforeAll(async () => {
  if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
    throw Error("E2E tests only run against the local test environment.");
  await pool.query(
    "UPDATE contents SET published_version_id=NULL WHERE owner_id IN (SELECT id FROM users WHERE email LIKE 'teacher-%@example.test' AND name='Demo Öğretmen')",
  );
});
test.afterAll(async () => {
  await pool.query(
    "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'editor-%@example.test' AND name='Demo Editör')",
  );
  await pool.query(
    "UPDATE users SET role='teacher' WHERE email LIKE 'editor-%@example.test' AND name='Demo Editör'",
  );
  await pool.end();
});
test("teacher uploads, real scanner processes, 2FA editor publishes, anonymous visitor plays and revocation works", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const teacher = `teacher-${suffix}@example.test`;
  await register(page.request, teacher, "Demo Öğretmen");
  await signIn(page.request, teacher);
  expect(
    (
      await page.request.post("/api/admin/grades/12", {
        headers: { origin },
        data: { active: false },
      })
    ).status(),
  ).toBe(403);
  await mkdir(".impeccable/review", { recursive: true });
  await page.goto("/ogretmen");
  await expect(
    page.getByRole("heading", { name: "İçeriklerim", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: ".impeccable/review/teacher-desktop.png",
    fullPage: true,
  });
  await page.goto("/ogretmen/yeni");
  await page.setViewportSize({ width: 360, height: 900 });
  await expect(page.getByLabel("Oyun paketi")).toBeVisible();
  await expect(page.getByLabel("Oyun başlığı", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: ".impeccable/review/upload-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const subject = (
    await pool.query(
      "SELECT id FROM taxonomy WHERE label='Matematik' AND kind='subject' LIMIT 1",
    )
  ).rows[0].id;
  const program = (
    await pool.query(
      "SELECT p.id,p.data FROM curriculum_programs p JOIN curriculum_catalogs c ON c.id=p.catalog_id AND c.status='active' WHERE p.subject_id=$1 AND p.data->'grades' @> '[4]' AND EXISTS(SELECT 1 FROM curriculum_outcomes o WHERE o.catalog_id=p.catalog_id AND o.program_id=p.id AND 4=ANY(o.grades) AND o.text ILIKE '%kesir%') ORDER BY p.data->>'versionLabel' DESC LIMIT 1",
      [subject],
    )
  ).rows[0];
  expect(program).toBeTruthy();
  const zip = new ZipFile();
  for (const name of await readdir("fixtures/demo")) {
    if (name === "index.html")
      zip.addBuffer(
        Buffer.from(
          (await readFile("fixtures/demo/" + name, "utf8")).replace(
            "</html>",
            '<canvas width="1" height="1"></canvas></html>',
          ),
        ),
        name,
      );
    else zip.addFile("fixtures/demo/" + name, name);
  }
  zip.addFile(
    "public/game-covers/demo-kesir-mutfagi.webp",
    "images/cover.webp",
  );
  zip.addBuffer(
    Buffer.from(
      JSON.stringify({
        schemaVersion: 2,
        cover: { path: "images/cover.webp" },
        title: "Kesir Mutfağı — Demo",
        description: "Eşit parçaları seçin ve kesir sorularını yanıtlayın.",
        grade: 4,
        subject: "Matematik",
        programId: program.id,
      }),
    ),
    "dijitalatolye.json",
  );
  zip.end();
  const chunks: Buffer[] = [];
  for await (const chunk of zip.outputStream)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  await page.getByLabel("Oyun paketi").setInputFiles({
    name: "demo-with-metadata.zip",
    mimeType: "application/zip",
    buffer: Buffer.concat(chunks),
  });

  await page.getByRole("button", { name: "Yükle ve taramayı başlat" }).click();
  await expect(page).toHaveURL(/\/ogretmen\/icerik\//);
  const contentId = page.url().split("/").pop()!;
  await expect
    .poll(
      async () => {
        const b = await (
          await page.request.get(`/api/contents/${contentId}`)
        ).json();
        return b.versions[0].state;
      },
      { timeout: 120000 },
    )
    .toBe("needs_metadata");
  await page.reload();
  await expect(page.getByLabel("Oyun başlığı", { exact: true })).toHaveValue(
    "Kesir Mutfağı — Demo",
  );
  await page
    .getByLabel("Öğretmen açıklaması")
    .fill(
      "Demo oyun: dört eşit parçadan oluşan bir bütün üzerinde kesirleri birlikte keşfedin. Sınıfta tartışarak oynayabilirsiniz.",
    );
  await page
    .getByRole("combobox", { name: "Sınıf", exact: true })
    .selectOption("4");
  await page
    .getByRole("combobox", { name: "Ders", exact: true })
    .selectOption(subject);

  await expect(
    page
      .getByRole("combobox", { name: "Öğretim programı", exact: true })
      .locator(`option[value="${program.id}"]`),
  ).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Öğretim programı", exact: true })
    .selectOption(program.id);
  if (program.data.schoolTypes?.length)
    await page
      .getByRole("combobox", { name: "Okul türü", exact: true })
      .selectOption(program.data.schoolTypes[0]);
  const automatic = page.waitForResponse(
    (r) =>
      r.url().includes("/api/curriculum/outcomes?") &&
      r.url().includes("versionId="),
  );
  await page.getByRole("button", { name: "Paketten kazanım öner" }).click();
  const automaticResult = await (await automatic).json();
  expect(automaticResult.items.length).toBeLessThanOrEqual(10);
  expect(
    automaticResult.items.every((item: any) => item.evidence && item.reason),
  ).toBe(true);
  await page.getByLabel("Kazanım ara", { exact: true }).fill("kesir");
  await page
    .getByRole("button", { name: "Katalogda ara", exact: true })
    .click();
  await expect(
    page.locator(".outcome-list input[type=checkbox]").first(),
  ).toBeVisible();
  await page.locator(".outcome-list input[type=checkbox]").first().check();
  await page
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(
    page.getByText(
      "Taslak kaydedildi. Daha sonra buradan devam edebilirsiniz.",
    ),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Seçilen kazanımlar (1)" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".chosen-outcomes")
      .getByText("Kaynak incelemesi gerekli", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#metadata-grade-source")).toContainText(
    "dijitalatolye.json",
  );
  await expect(page.locator("#metadata-subject-source")).toContainText(
    "/subject",
  );
  await expect(page.locator("#metadata-program-source")).toContainText(
    "/programId",
  );
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.get(
              `/api/versions/${(await (await page.request.get(`/api/contents/${contentId}`)).json()).versions[0].id}/cover`,
            )
          ).json()
        ).cover?.status,
      { timeout: 60000 },
    )
    .toBe("ready");
  await expect(page.locator(".cover-preview img")).toBeVisible();
  await page
    .getByLabel("Kapak görseli yükle", { exact: true })
    .setInputFiles("public/game-covers/demo-kesir-mutfagi.webp");
  await expect(page.locator(".cover-preview")).toContainText(
    "Öğretmenin yüklediği görsel",
    { timeout: 60000 },
  );
  await page
    .getByRole("button", { name: "Otomatik kapak kullan", exact: true })
    .click();
  await expect(page.locator(".cover-preview")).toContainText("Otomatik kapak", {
    timeout: 60000,
  });
  await page
    .getByText("Teknik rapor ve sürüm bilgileri", { exact: true })
    .click();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByText("Müfredat kayıtları getiriliyor…"),
    ).toBeHidden();
    await expect(
      page.getByText("Dosya ve sürüm bilgileri", { exact: true }),
    ).toBeVisible();
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/technical-metadata-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page
      .locator(".cover-editor")
      .screenshot({
        path: `.impeccable/review/cover-detail-${width}.png`,
        animations: "disabled",
      });
  }
  await page
    .getByRole("button", { name: "Bilgileri onayla ve incelemeye gönder" })
    .click();
  await expect
    .poll(async () => {
      const b = await (
        await page.request.get(`/api/contents/${contentId}`)
      ).json();
      return b.versions[0].state;
    })
    .toBe("review");
  const body = await (
    await page.request.get(`/api/contents/${contentId}`)
  ).json();
  const v = body.versions[0];
  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await register(
    strangerPage.request,
    `other-${suffix}@example.test`,
    "Başka Öğretmen",
  );
  await signIn(strangerPage.request, `other-${suffix}@example.test`);
  expect(
    (await strangerPage.request.get(`/api/contents/${contentId}`)).status(),
  ).toBe(403);
  expect(
    (
      await strangerPage.request.get(`/api/versions/${v.id}/extraction`)
    ).status(),
  ).toBe(403);
  expect(
    (
      await strangerPage.request.post(`/api/versions/${v.id}/decision`, {
        headers: { origin },
        data: {
          sha256: v.sha256,
          decision: "approve",
          note: "Yetkisiz deneme",
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await strangerPage.request.get(`/api/versions/${v.id}/cover/image`)
    ).status(),
  ).toBe(403);
  await stranger.close();
  const editor = await browser.newContext();
  const ep = await editor.newPage();
  const editorEmail = `editor-${suffix}@example.test`;
  await register(ep.request, editorEmail, "Demo Editör");
  await pool.query("UPDATE users SET role='editor' WHERE email=$1", [
    editorEmail,
  ]);
  await signIn(ep.request, editorEmail);
  expect(
    (
      await ep.request.post(`/api/versions/${v.id}/decision`, {
        headers: { origin },
        data: {
          sha256: v.sha256,
          decision: "approve",
          note: "2FA olmadan deneme",
        },
      })
    ).status(),
  ).toBe(403);
  const enabled = await ep.request.post("/api/auth/two-factor/enable", {
    headers: { origin },
    data: { password },
  });
  expect(enabled.ok(), await enabled.text()).toBeTruthy();
  const setup = await enabled.json();
  const code = totp(new URL(setup.totpURI).searchParams.get("secret")!);
  const verified = await ep.request.post("/api/auth/two-factor/verify-totp", {
    headers: { origin },
    data: { code },
  });
  expect(verified.ok(), await verified.text()).toBeTruthy();
  await ep.goto(`/editor/${v.id}`);
  await expect(
    ep.getByRole("tab", { name: "Değerlendirme", exact: true }),
  ).toBeVisible();
  await ep.getByRole("button", { name: "Oyunu önizle" }).click();
  const preview = ep.frameLocator("iframe");
  await expect(
    preview.getByRole("heading", { name: "Kesir mutfağı", exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "1/4", exact: true }),
  ).toBeVisible();
  await ep.locator("iframe").scrollIntoViewIfNeeded();
  await preview.locator("body").evaluate(() => document.fonts.ready);
  await preview.getByRole("button", { name: "1/4", exact: true }).press("Enter");
  await expect(preview.getByRole("status")).toContainText("Harika");
  const screenshot = await ep.locator("iframe").screenshot();
  const thumb = await page.request.post(`/api/versions/${v.id}/thumbnail`, {
    headers: {
      origin,
      "content-type": "image/png",
      "X-Package-Sha256": v.sha256,
      "X-Metadata-Revision": String(v.metadataRevision),
      "X-Cover-Revision": String(v.cover.revision),
    },
    data: screenshot,
  });
  expect(thumb.status()).toBe(409);
  await ep
    .getByRole("button", { name: "Önizlemeyi kapat", exact: true })
    .click();
  await ep.setViewportSize({ width: 360, height: 900 });
  await ep.screenshot({
    path: ".impeccable/review/editor-mobile.png",
    fullPage: true,
  });
  await ep.setViewportSize({ width: 1440, height: 1000 });
  const denied = await ep.request.post(`/api/versions/${v.id}/decision`, {
    headers: { origin },
    data: {
      sha256: v.sha256,
      revision: v.metadataRevision,
      decision: "approve",
      note: "Kaynak doğrulaması olmadan deneme.",
      review: reviewPayload(v),
    },
  });
  expect(denied.status()).toBe(409);
  await ep.getByRole("tab", { name: "Değerlendirme", exact: true }).click();
  await fillEditorialForm(ep);
  await ep.getByRole("tab", { name: "Teknik inceleme", exact: true }).click();
  await ep.getByRole("tab", { name: "Değerlendirme", exact: true }).click();
  await expect(ep.locator('[name="note.science"]')).toHaveValue(
    "Demo önizlemede incelendi; sınıf içi kullanım için uygun.",
  );
  await ep.getByRole("button", { name: "Kaynak ve süreçleri incele" }).click();
  await expect(
    ep.getByText("Hash ile doğrulanmış PDF’yi indir").first(),
  ).toBeVisible();
  for (const width of [390, 768, 1440]) {
    await ep.setViewportSize({ width, height: 1000 });
    expect(
      await ep.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await ep.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await ep.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
    });
    await ep.screenshot({
      path: `.impeccable/review/technical-editor-${width}.png`,
      fullPage: true,
    });
    await ep
      .locator(".assessment-fields")
      .screenshot({
        path: `.impeccable/review/assessment-detail-${width}.png`,
        animations: "disabled",
      });
  }
  await ep.getByLabel("Bu kazanımı yayın ilişkisinden çıkar").check();
  await ep
    .getByRole("combobox", { name: "Karar", exact: true })
    .selectOption("approve");
  await ep
    .getByLabel("Gerekçe / öğretmene not")
    .fill(
      "Demo oyun incelendi; kesir etkinliği için uygun. Kaynağı doğrulanamayan kazanım ilişkisi çıkarıldı.",
    );
  await ep.getByRole("button", { name: "Kararı kaydet" }).click();
  await expect
    .poll(
      async () => {
        const b = await (
          await page.request.get(`/api/contents/${contentId}`)
        ).json();
        return b.content.publishedVersionId;
      },
      { timeout: 120000 },
    )
    .toBe(v.id);
  // Explicitly label demonstration data; this does not bypass scanning, decision or publication.
  await pool.query(
    "UPDATE content_versions SET metadata=jsonb_set(metadata,'{demo}','true') WHERE id=$1",
    [v.id],
  );
  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(`/oyna/${body.content.slug}`);
  const game = vp.frameLocator("iframe");
  await expect(
    game.getByRole("button", { name: "1/4", exact: true }),
  ).toBeVisible();
  await game.getByRole("button", { name: "1/4", exact: true }).click();
  await expect(game.getByRole("status")).toContainText("Harika");
  const gameUrl = await vp.locator("iframe").getAttribute("src");
  const asset = await vp.request.get(gameUrl!);
  expect(asset.ok()).toBeTruthy();
  expect(asset.headers()["content-security-policy"]).toContain(
    "sandbox allow-scripts allow-same-origin",
  );
  await mkdir(".impeccable/review", { recursive: true });
  await vp.goto("/");
  for (const width of [1440, 768, 360]) {
    await vp.setViewportSize({ width, height: width === 360 ? 900 : 1000 });
    await vp.evaluate(() => document.fonts.ready);
    await expect(vp.locator("h1")).toBeVisible();
    expect(
      await vp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await vp.screenshot({
      path: `.impeccable/review/${width === 1440 ? "desktop" : width === 360 ? "mobile" : "tablet"}.png`,
      fullPage: true,
    });
  }
  await vp.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await vp.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await vp.keyboard.press("Tab");
  const skip = vp.getByRole("link", { name: "İçeriğe geç" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  expect(
    await skip.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe("solid");
  await vp.keyboard.press("Enter");
  await vp.emulateMedia({ reducedMotion: "no-preference" });
  await ep.screenshot({
    path: ".impeccable/review/editor.png",
    fullPage: true,
  });
  await vp.goto("/kesfet?q=kesir&grade=4");
  await expect(
    vp.getByRole("heading", { name: v.metadata.title, exact: true }),
  ).toBeVisible();
  await vp.goto("/kesfet?q=bulunmayan-oyun");
  await expect(
    vp.getByRole("heading", { name: "Henüz bir eşleşme yok" }),
  ).toBeVisible();
  await vp.screenshot({ path: ".impeccable/review/empty.png", fullPage: true });
  expect(
    (
      await ep.request.post(`/api/contents/${contentId}/unpublish`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await pool.query("UPDATE users SET role='admin' WHERE email=$1", [
    editorEmail,
  ]);
  const unpublish = await ep.request.post(
    `/api/contents/${contentId}/unpublish`,
    { headers: { origin }, data: {} },
  );
  expect(unpublish.ok()).toBeTruthy();
  expect((await vp.request.get(gameUrl!)).status()).toBe(403);
  await pool.query("UPDATE users SET role='editor' WHERE email=$1", [
    editorEmail,
  ]);
  // Restore the demonstrator through a fresh upload and explicit review, never a publication shortcut.
  const reupload = await page.request.post(
    `/api/contents/${contentId}/versions`,
    {
      headers: { origin },
      multipart: {
        metadata: JSON.stringify({ ...v.metadata, outcomeRefs: [] }),
        archive: {
          name: "demo.zip",
          mimeType: "application/zip",
          buffer: await readFile("fixtures/demo-game.zip"),
        },
      },
    },
  );
  expect(reupload.ok(), await reupload.text()).toBeTruthy();
  const nextId = (await reupload.json()).versionId;
  await expect
    .poll(
      async () => {
        const b = await (
          await page.request.get(`/api/contents/${contentId}`)
        ).json();
        return b.versions.find((x: any) => x.id === nextId).state;
      },
      { timeout: 120000 },
    )
    .toBe("needs_metadata");
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`/api/versions/${nextId}/cover`)).json())
          .cover?.status,
      { timeout: 60000 },
    )
    .toBe("ready");
  const nextVersion = (
    await (await page.request.get(`/api/contents/${contentId}`)).json()
  ).versions.find((x: any) => x.id === nextId);
  const submitted = await page.request.post(`/api/versions/${nextId}/submit`, {
    headers: { origin },
    data: {
      sha256: nextVersion.sha256,
      revision: nextVersion.metadataRevision,
      metadata: { ...v.metadata, outcomeRefs: [] },
    },
  });
  expect(submitted.ok(), await submitted.text()).toBeTruthy();
  const approval = await ep.request.post(`/api/versions/${nextId}/decision`, {
    headers: { origin },
    data: {
      sha256: nextVersion.sha256,
      revision: nextVersion.metadataRevision + 1,
      decision: "approve",
      note: "Aynı demo paketi tekrar tarandı ve inceleme tamamlandı.",
      review: reviewPayload({
        ...nextVersion,
        metadata: { ...v.metadata, outcomeRefs: [] },
      }),
    },
  });
  expect(approval.ok(), await approval.text()).toBeTruthy();
  await expect
    .poll(
      async () => {
        const b = await (
          await page.request.get(`/api/contents/${contentId}`)
        ).json();
        return b.content.publishedVersionId;
      },
      { timeout: 120000 },
    )
    .toBe(nextId);
  await pool.query(
    "UPDATE content_versions SET metadata=jsonb_set(metadata,'{demo}','true') WHERE id=$1",
    [nextId],
  );
  await page.goto(`/ogretmen/icerik/${contentId}`);
  await page
    .getByRole("button", { name: "Kapağı veya bilgileri düzenle", exact: true })
    .click();
  let clone: any;
  await expect
    .poll(
      async () => {
        const b = await (
          await page.request.get(`/api/contents/${contentId}`)
        ).json();
        expect(b.content.publishedVersionId).toBe(nextId);
        clone = b.versions.find((x: any) => x.id === b.content.draftVersionId);
        return (
          clone?.id !== nextId &&
          clone?.state === "needs_metadata" &&
          clone?.cover?.status === "ready"
        );
      },
      { timeout: 120000 },
    )
    .toBe(true);
  expect(clone.sha256).toBe(nextVersion.sha256);
  const cloneSubmit = await page.request.post(
    `/api/versions/${clone.id}/submit`,
    {
      headers: { origin },
      data: {
        sha256: clone.sha256,
        revision: clone.metadataRevision,
        metadata: clone.draftMetadata,
      },
    },
  );
  expect(cloneSubmit.ok(), await cloneSubmit.text()).toBeTruthy();
  const cloneApproval = await ep.request.post(
    `/api/versions/${clone.id}/decision`,
    {
      headers: { origin },
      data: {
        sha256: clone.sha256,
        revision: clone.metadataRevision + 1,
        decision: "approve",
        note: "TEST ONLY: cover revision inspected.",
        review: reviewPayload({ ...clone, metadata: clone.draftMetadata }),
      },
    },
  );
  expect(cloneApproval.ok(), await cloneApproval.text()).toBeTruthy();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`/api/contents/${contentId}`)).json())
          .content.publishedVersionId,
      { timeout: 120000 },
    )
    .toBe(clone.id);
  await pool.query(
    "UPDATE content_versions SET metadata=jsonb_set(metadata,'{demo}','true') WHERE id=$1",
    [clone.id],
  );
  await vp.goto(`/icerik/${body.content.slug}`);
  await expect(
    vp.getByRole("heading", { name: v.metadata.title, exact: true, level: 1 }),
  ).toBeVisible();
  await vp.screenshot({
    path: ".impeccable/review/detail-mobile.png",
    fullPage: true,
  });
  await vp.goto(`/oyna/${body.content.slug}`);
  await expect(
    vp.frameLocator("iframe").getByRole("button", { name: "1/4", exact: true }),
  ).toBeVisible();
  await vp.screenshot({
    path: ".impeccable/review/play-mobile.png",
    fullPage: true,
  });
  await vp.goto("/giris");
  await expect(
    vp.getByRole("button", { name: "Giriş yap", exact: true }),
  ).toBeVisible();
  await vp.screenshot({
    path: ".impeccable/review/login-mobile.png",
    fullPage: true,
  });
  // A separate admin role may operate the system, but cannot approve content.
  await pool.query("UPDATE users SET role='admin' WHERE email=$1", [
    editorEmail,
  ]);
  expect(
    (
      await ep.request.post(`/api/versions/${v.id}/decision`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await ep.goto(`/editor/${v.id}`);
  await expect(
    ep.getByRole("tab", { name: "Değerlendirme", exact: true }),
  ).toHaveCount(0);
  await ep.goto("/yonetim?bolum=tanimlar");
  await expect(
    ep.getByRole("heading", { name: "Tanımlar", exact: true }),
  ).toBeVisible();
  await ep.getByText("Sınıf tanımları", { exact: true }).click();
  const gradeRow = ep
    .locator(".workspace-disclosure .content-row")
    .filter({ hasText: "12. sınıf" });
  await gradeRow
    .getByRole("button", { name: "Pasifleştir", exact: true })
    .click();
  await expect(
    gradeRow.getByRole("button", { name: "Etkinleştir", exact: true }),
  ).toBeVisible();
  await page.goto("/ogretmen/yeni");
  await expect(page.getByLabel("Oyun paketi")).toBeVisible();
  await gradeRow
    .getByRole("button", { name: "Etkinleştir", exact: true })
    .click();
  await expect(
    gradeRow.getByRole("button", { name: "Pasifleştir", exact: true }),
  ).toBeVisible();
  await ep.setViewportSize({ width: 360, height: 900 });
  expect(
    await ep.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await ep.screenshot({
    path: ".impeccable/review/admin-grades-mobile.png",
    fullPage: true,
  });
  await ep.goto("/yonetim?bolum=kayitlar");
  await expect(ep.locator(".audit-table")).toBeVisible();
  await ep.screenshot({
    path: ".impeccable/review/admin-audit-mobile.png",
    fullPage: true,
  });
  expect(
    await ep
      .locator(".audit-table tbody tr")
      .first()
      .evaluate((row) => row.getBoundingClientRect().height),
  ).toBeLessThan(100);
  await visitor.close();
  await editor.close();
});
