import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { Pool } from "pg";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

const origin = process.env.APP_URL || "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let auth: Awaited<ReturnType<BrowserContext["storageState"]>>;
let fixtureContent: string, fixtureVersion: string;
const shots = ".impeccable/review/21st";
const name =
  "Öğretmenin_çok_uzun_dosya_adıyla_kaydettiği_kesirler_ve_öğrenme_etkinliği_".repeat(
    3,
  ) + ".HTML";

test.beforeAll(async ({ request }) => {
  if (
    !["localhost", "127.0.0.1"].includes(new URL(origin).hostname) ||
    !new URL(process.env.DATABASE_URL!).pathname.endsWith("_test")
  )
    throw Error("A local *_test database is required.");
  const email = `upload-pilot-${Date.now()}@example.test`,
    password = randomBytes(24).toString("hex");
  const signed = await request.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: { name: "Yükleme Pilotu", email, password },
  });
  expect(signed.ok(), await signed.text()).toBe(true);
  await pool.query("UPDATE users SET email_verified=true WHERE email=$1", [
    email,
  ]);
  const login = await request.post("/api/auth/sign-in/email", {
    headers: { origin },
    data: { email, password },
  });
  expect(login.ok()).toBe(true);
  auth = await request.storageState();
  const created = await request.post("/api/contents", {
    headers: { origin },
    data: {},
  });
  fixtureContent = (await created.json()).id;
  fixtureVersion = randomUUID();
  // Presentation fixture only; the real scanner/publication is exercised by lifecycle.spec.ts.
  await pool.query(
    "INSERT INTO content_versions(id,content_id,sha256,format,metadata,original_filename,state) VALUES($1,$2,$3,'html',$4,'Pilot.html','queued')",
    [
      fixtureVersion,
      fixtureContent,
      "0".repeat(64),
      JSON.stringify({
        title: "Pilot durum kaydı",
        description: "Yalnız yerel arayüz testi",
        grade: 4,
        outcomeIds: [],
        outcomeRefs: [],
      }),
    ],
  );
  await pool.query("UPDATE contents SET draft_version_id=$1 WHERE id=$2", [
    fixtureVersion,
    fixtureContent,
  ]);
  await mkdir(shots, { recursive: true });
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(auth.cookies);
});
test.afterAll(async () => {
  await pool.end();
});

async function select(
  page: Page,
  mode: "picker" | "drop",
  files: { name: string; size: number }[],
) {
  // The native picker confirms the React click handler is ready before file
  // events are sent. Synthetic dispatch immediately after navigation can run
  // before hydration in the production build and silently lose the selection.
  if (
    mode === "picker" &&
    files.length === 1 &&
    files[0].size < 50 * 1024 * 1024
  ) {
    const choosing = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: /^(Dosya seç|Dosyayı değiştir)$/ })
      .click();
    await (
      await choosing
    ).setFiles({
      name: files[0].name,
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(files[0].size),
    });
    return;
  }
  await page.evaluate(
    ({ mode, files }) => {
      const transfer = new DataTransfer();
      for (const file of files)
        transfer.items.add(
          new File([new Uint8Array(file.size)], file.name, {
            type: "application/octet-stream",
          }),
        );
      if (mode === "drop")
        document
          .querySelector(".package-dropzone")!
          .dispatchEvent(
            new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
          );
      else {
        const input = document.querySelector<HTMLInputElement>(
          'input[name="archive"]',
        )!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    { mode, files },
  );
}
async function screenshot(page: Page, label: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${shots}/${label}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test("native picker and drop share validation, retain valid selections and work with keyboard", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/api/contents")) requests++;
  });
  await page.goto("/ogretmen/yeni");
  const choose = page.getByRole("button", { name: "Dosya seç", exact: true });
  await choose.focus();
  await expect(choose).toBeFocused();
  expect(await choose.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
  const chooser = page.waitForEvent("filechooser");
  await choose.press("Enter");
  await (
    await chooser
  ).setFiles({
    name: "OYUN.HTM",
    mimeType: "text/html",
    buffer: Buffer.from("<h1>Oyun</h1>"),
  });
  await expect(page.locator(".package-filename")).toHaveText("OYUN.HTM");
  for (const mode of ["picker", "drop"] as const) {
    for (const filename of ["oyun.HTML", "oyun.HTM", "oyun.ZIP"]) {
      await select(page, mode, [{ name: filename, size: 12 }]);
      await expect(page.locator(".package-filename")).toHaveText(filename);
    }
    await select(page, mode, [
      { name: "sinir.ZIP", size: 50 * 1024 * 1024 - 1 },
    ]);
    await expect(page.locator(".package-filename")).toHaveText("sinir.ZIP");
    for (const [files, message] of [
      [[{ name: "bos.html", size: 0 }], "dosya boş"],
      [[{ name: "tam-sinir.zip", size: 50 * 1024 * 1024 }], "50 MB"],
      [[{ name: "buyuk.zip", size: 50 * 1024 * 1024 + 1 }], "50 MB"],
      [
        [
          { name: "a.html", size: 1 },
          { name: "b.zip", size: 1 },
        ],
        "yalnızca bir",
      ],
      [[{ name: "oyun.exe", size: 1 }], "HTML (.html, .htm)"],
    ] as const) {
      await select(page, mode, [...files]);
      await expect(
        page.locator(".upload-first").getByRole("alert"),
      ).toContainText(message);
      await expect(page.locator(".package-filename")).toHaveText("sinir.ZIP");
    }
  }
  await select(page, "picker", [{ name, size: 1000 }]);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await screenshot(page, `upload-selected-${width}`);
    await select(page, "drop", [{ name: "bos.html", size: 0 }]);
    await screenshot(page, `upload-error-${width}`);
    await select(page, "picker", [{ name, size: 1000 }]);
    const rects = await page
      .locator(".package-picker button")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(rects.every((h) => h >= 44)).toBe(true);
    const orientation = await page
      .locator(".publication-steps li")
      .first()
      .evaluate((el) => getComputedStyle(el).flexDirection);
    expect(orientation).toBe(width >= 768 ? "column" : "row");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".package-dropzone")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.getByRole("button", { name: "Dosyayı kaldır" }).click();
  await expect(
    page.getByRole("button", { name: "Dosya seç", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".package-filename")).toHaveCount(0);
  await page.setViewportSize({ width: 640, height: 1000 });
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  await screenshot(page, "upload-200-percent");
  expect(requests).toBe(0);
});

test("double submit makes one request, progress follows transfer events, controls lock until error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.pilotRequests = [];
    w.XMLHttpRequest = class {
      upload: any = {};
      onerror: any;
      onload: any;
      status = 0;
      responseText = "";
      open() {}
      send() {
        w.pilotRequests.push(this);
      }
    };
  });
  await page.route("**/api/contents", (r) =>
    r.fulfill({ json: { id: fixtureContent } }),
  );
  await page.goto("/ogretmen/yeni");
  await select(page, "picker", [{ name: "oyun.html", size: 100 }]);
  await page.locator("form.upload-first").evaluate((el: HTMLFormElement) => {
    el.requestSubmit();
    el.requestSubmit();
  });
  await expect
    .poll(() => page.evaluate(() => (window as any).pilotRequests.length))
    .toBe(1);
  for (const label of ["Dosyayı değiştir", "Dosyayı kaldır"])
    await expect(page.getByRole("button", { name: label })).toBeDisabled();
  await expect(page.locator('input[name="thumbnail"]')).toBeDisabled();
  await page.evaluate(() =>
    (window as any).pilotRequests[0].upload.onprogress({
      lengthComputable: true,
      loaded: 37,
      total: 100,
    }),
  );
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "37");
  await page.evaluate(() => (window as any).pilotRequests[0].upload.onload());
  await expect(page.locator(".package-transfer")).toHaveText(
    "Sunucuya kaydediliyor…",
  );
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.evaluate(() => (window as any).pilotRequests[0].onerror());
  await expect(page.locator(".upload-first").getByRole("alert")).toContainText(
    "Bağlantı kesildi",
  );
  await expect(page.locator(".package-filename")).toHaveText("oyun.html");
});

test("network, HTTP and malformed response failures preserve selection and content id on manual retry", async ({
  page,
}) => {
  let creates = 0,
    uploads = 0;
  await page.route("**/api/contents", (r) => {
    creates++;
    return r.fulfill({ json: { id: fixtureContent } });
  });
  await page.route(`**/api/contents/${fixtureContent}/versions`, (r) => {
    uploads++;
    return uploads === 1
      ? r.abort("failed")
      : uploads === 2
        ? r.fulfill({
            status: 500,
            contentType: "text/html",
            body: "Server unavailable",
          })
        : r.fulfill({ status: 202, body: uploads === 3 ? "not JSON" : "{}" });
  });
  await page.goto("/ogretmen/yeni");
  await select(page, "picker", [{ name: "oyun.html", size: 100 }]);
  for (const message of [
    "Bağlantı kesildi",
    "HTTP 500",
    "yanıtı okunamadı",
    "sürüm kimliğini",
  ]) {
    await page
      .getByRole("button", { name: "Yükle ve taramayı başlat" })
      .click();
    await expect(
      page.locator(".upload-first").getByRole("alert"),
    ).toContainText(message);
    await expect(page.locator(".package-filename")).toHaveText("oyun.html");
    await expect(
      page.getByRole("link", { name: "İçerik kaydını kontrol et" }),
    ).toHaveAttribute("href", `/ogretmen/icerik/${fixtureContent}`);
    expect(creates).toBe(1);
  }
  expect(uploads).toBe(4);
});

test("content creation network failure offers list recovery without automatic retry", async ({
  page,
}) => {
  let creates = 0;
  await page.route("**/api/contents", (r) => {
    creates++;
    return r.abort("failed");
  });
  await page.goto("/ogretmen/yeni");
  await select(page, "picker", [{ name: "oyun.html", size: 100 }]);
  await page.getByRole("button", { name: "Yükle ve taramayı başlat" }).click();
  await expect(page.locator(".upload-first").getByRole("alert")).toContainText(
    "İçerik kaydı oluşturulurken bağlantı kesildi",
  );
  await expect(
    page.getByRole("link", { name: "İçeriklerim listesini kontrol et" }),
  ).toHaveAttribute("href", "/ogretmen");
  expect(creates).toBe(1);
});

for (const failure of [
  "lookup-network",
  "lookup-malformed",
  "lookup-missing",
  "cover-network",
  "cover-http",
] as const) {
  test(`acknowledged game navigates to detail despite ${failure}`, async ({
    page,
  }) => {
    let uploads = 0;
    await page.route("**/api/contents", (r) =>
      r.fulfill({ json: { id: fixtureContent } }),
    );
    await page.route(`**/api/contents/${fixtureContent}/versions`, (r) => {
      uploads++;
      return r.fulfill({ status: 202, json: { versionId: fixtureVersion } });
    });
    await page.route(`**/api/contents/${fixtureContent}`, (r) =>
      failure === "lookup-network"
        ? r.abort("failed")
        : failure === "lookup-malformed"
          ? r.fulfill({ body: "broken" })
          : r.fulfill({
              json: {
                versions:
                  failure === "lookup-missing"
                    ? []
                    : [
                        {
                          id: fixtureVersion,
                          sha256: "0".repeat(64),
                          metadataRevision: 0,
                          cover: { revision: 0 },
                        },
                      ],
              },
            }),
    );
    await page.route(`**/api/versions/${fixtureVersion}/thumbnail`, (r) =>
      failure === "cover-network"
        ? r.abort("failed")
        : r.fulfill({ status: 500, json: { error: "cover failure" } }),
    );
    await page.goto("/ogretmen/yeni");
    await select(page, "picker", [{ name: "oyun.html", size: 100 }]);
    await page.getByLabel("Kapak görseli (isteğe bağlı)").setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: Buffer.from("cover fixture"),
    });
    await page
      .getByRole("button", { name: "Yükle ve taramayı başlat" })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/ogretmen/icerik/${fixtureContent}\\?cover=failed$`),
    );
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Oyun dosyanız yüklendi; kapak eklenemedi" }),
    ).toBeVisible();
    expect(uploads).toBe(1);
  });
}

test("status views distinguish current, previous and revoked publications without interactive steps", async ({
  page,
}) => {
  const prior = randomUUID();
  await pool.query(
    "INSERT INTO content_versions(id,content_id,sha256,format,metadata,state) VALUES($1,$2,$3,'html',$4,'published')",
    [
      prior,
      fixtureContent,
      "1".repeat(64),
      JSON.stringify({ title: "Önceki yayın", grade: 4 }),
    ],
  );
  await pool.query("UPDATE contents SET published_version_id=$1 WHERE id=$2", [
    prior,
    fixtureContent,
  ]);
  await pool.query("UPDATE content_versions SET state='review' WHERE id=$1", [
    fixtureVersion,
  ]);
  await page.goto(`/ogretmen/icerik/${fixtureContent}`);
  await expect(
    page.locator('.publication-steps [aria-current="step"]'),
  ).toContainText("İnceleme");
  await expect(page.locator(".publication-live-note")).toContainText(
    "Önceki sürüm yayında",
  );
  await expect(
    page.locator(".publication-steps").getByRole("button"),
  ).toHaveCount(0);
  await expect(page.locator(".publication-steps").getByRole("tab")).toHaveCount(
    0,
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await screenshot(page, `publication-review-${width}`);
  }
  await page.goto("/ogretmen");
  await expect(
    page.locator(".content-row").filter({ hasText: "Önceki sürüm yayında" }),
  ).toContainText("Yönetici incelemesi bekleniyor");
  await pool.query(
    "UPDATE content_versions SET state='published',revoked_at=now() WHERE id=$1",
    [fixtureVersion],
  );
  await pool.query("UPDATE contents SET published_version_id=$1 WHERE id=$2", [
    fixtureVersion,
    fixtureContent,
  ]);
  await page.goto(`/ogretmen/icerik/${fixtureContent}`);
  await expect(page.locator(".publication-summary")).toContainText(
    "yayını iptal edildi",
  );
  await expect(
    page.getByRole("link", { name: "Yayındaki oyunu gör" }),
  ).toHaveCount(0);
  await expect(page.locator(".publication-steps [aria-current]")).toHaveCount(
    0,
  );
  await page.goto("/ogretmen");
  await expect(
    page.locator(".content-row").filter({ hasText: "yayını iptal edildi" }),
  ).toContainText("Yayında değil");
  await pool.query("UPDATE content_versions SET revoked_at=NULL WHERE id=$1", [
    fixtureVersion,
  ]);
  await page.goto(`/ogretmen/icerik/${fixtureContent}`);
  await expect(page.locator(".publication-summary")).toContainText(
    "Oyununuz yayında",
  );
  await expect(page.locator(".publication-steps [aria-current]")).toContainText(
    "Yayın",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await screenshot(page, `publication-live-${width}`);
  }
  await pool.query(
    "UPDATE contents SET published_version_id=NULL WHERE id=$1",
    [fixtureContent],
  );
});
