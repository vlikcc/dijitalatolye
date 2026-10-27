import {
  test,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { Pool } from "pg";
import { randomUUID, createHmac } from "node:crypto";
import { mkdir } from "node:fs/promises";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const origin = process.env.APP_URL!;
const marker = `Atölye ${Date.now()}`;
const password = "Workspace-test-" + randomUUID();
let auth: Awaited<ReturnType<BrowserContext["storageState"]>>,
  editorAuth: typeof auth;
let classA: string,
  classB: string,
  game: string,
  version: string,
  reportId: string,
  untrackedReport: string,
  metadataContent: string,
  reviewVersion: string,
  subject: string;
const students: string[] = [];
const shots = ".impeccable/review/21st-workspace/after";
async function post(api: APIRequestContext, path: string, data: unknown) {
  const r = await api.post(path, { headers: { origin }, data });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
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
    ),
    counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac("sha1", key).update(counter).digest(),
    offset = h[19] & 15;
  return ((h.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
async function capture(page: Page, name: string) {
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator(".workspace-loading")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${shots}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
async function chooseGame(page: Page) {
  const picker = page.getByRole("combobox", { name: "Oyun", exact: true });
  await picker.fill(marker + " Kayıt");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(1);
  await picker.press("ArrowDown");
  await picker.press("Enter");
  await expect(picker).toHaveValue(marker + " Kayıtlı");
  await expect(picker).toHaveAttribute("aria-expanded", "false");
  await picker.press("ArrowDown");
  await expect(picker).toHaveAttribute("aria-expanded", "true");
  await picker.press("Escape");
  await expect(picker).toHaveAttribute("aria-expanded", "false");
  await expect(picker).toBeFocused();
}
test.beforeAll(async ({ playwright }) => {
  if (
    !new URL(process.env.DATABASE_URL!).pathname.endsWith("_test") ||
    !["localhost", "127.0.0.1"].includes(new URL(origin).hostname)
  )
    throw Error("Dedicated local test database required");
  await mkdir(shots, { recursive: true });
  const api = await playwright.request.newContext({ baseURL: origin });
  const email = `workspace-${randomUUID()}@example.test`;
  await post(api, "/api/auth/sign-up/email", {
    name: "Atölye Öğretmeni",
    email,
    password,
  });
  const teacher = (
    await pool.query(
      "UPDATE users SET email_verified=true WHERE email=$1 RETURNING id",
      [email],
    )
  ).rows[0].id;
  await post(api, "/api/auth/sign-in/email", { email, password });
  auth = await api.storageState();
  classA = (
    await post(api, "/api/learning/classes", { name: "4-A Çalışma Sınıfı" })
  ).id;
  classB = (
    await post(api, "/api/learning/classes", { name: "4-B Çalışma Sınıfı" })
  ).id;
  for (let i = 0; i < 50; i++) {
    const id = randomUUID();
    students.push(id);
    await pool.query(
      "INSERT INTO users(id,name,email,role) VALUES($1,$2,$3,'student')",
      [id, `Deniz ${String(i).padStart(2, "0")}`, `${id}@student.invalid`],
    );
    await pool.query(
      "INSERT INTO student_profiles(user_id,username) VALUES($1,$2)",
      [id, `deniz_${i}_${Date.now()}`],
    );
    await pool.query(
      "INSERT INTO classroom_members(class_id,student_id,status) VALUES($1,$2,'active')",
      [classA, id],
    );
  }
  await pool.query(
    "INSERT INTO classroom_members(class_id,student_id,status) VALUES($1,$2,'active')",
    [classB, students[49]],
  );
  subject = (
    await pool.query("SELECT id FROM taxonomy WHERE label='Matematik' LIMIT 1")
  ).rows[0].id;
  for (let i = 0; i < 54; i++) {
    const c = randomUUID(),
      v = randomUUID();
    const state = i < 2 ? "published" : i === 2 ? "needs_metadata" : "review";
    const metadata = {
      title:
        i === 0
          ? marker + " Kayıtlı"
          : i === 1
            ? marker + " Açılma"
            : marker + ` İçerik ${i}`,
      description:
        "Öğrenciler için kesir ve parça bütün ilişkisini öğretmeye yönelik uzun açıklama.",
      grade: 4,
      subjectId: subject,
      outcomeIds: [],
      outcomeRefs: [],
    };
    await pool.query(
      "INSERT INTO contents(id,owner_id,slug) VALUES($1,$2,$3)",
      [c, teacher, c],
    );
    const technical = {
      id: randomUUID(),
      versionId: v,
      sha256: "d".repeat(64),
      entrypoint: "index.html",
      rulesVersion: "2.0.0",
      status: "complete",
      at: new Date().toISOString(),
      filesChecked: [],
      completedChecks: [],
      findings: [
        {
          rule: "a11y.keyboard",
          severity: "warning",
          group: "accessibility",
          file: "index.html",
          location: "1",
          evidence: "",
          message: "Klavye ile inceleyin",
          remedy: "Önizlemede doğrulayın",
        },
      ],
      accessibility: "complete",
      limitations: [],
    };
    const cover = {
      revision: 0,
      selection: { mode: "generated" },
      status: "ready",
      artifact: {
        id: randomUUID(),
        source: "generated",
        sourceHash: "d".repeat(64),
        rendererVersion: "1.0.0",
        metadataRevision: 0,
        metadataKey: "test",
        smallHash: "d".repeat(64),
        largeHash: "d".repeat(64),
      },
    };
    await pool.query(
      "INSERT INTO content_versions(id,content_id,sha256,format,state,metadata,draft_metadata,metadata_confirmed_at,tracking,technical_report,cover) VALUES($1,$2,$3,'html',$4,$5,$5,now(),$6,$7,$8)",
      [
        v,
        c,
        "d".repeat(64),
        state,
        JSON.stringify(metadata),
        i === 0,
        JSON.stringify(technical),
        JSON.stringify(cover),
      ],
    );
    await pool.query(
      "UPDATE content_versions SET scan_report=$2,entrypoint='index.html',metadata_confirmed_at=CASE WHEN state='needs_metadata' THEN NULL ELSE metadata_confirmed_at END WHERE id=$1",
      [v, JSON.stringify({ status: "clean" })],
    );
    await pool.query(
      "UPDATE contents SET draft_version_id=$2,published_version_id=$3 WHERE id=$1",
      [c, v, i < 2 ? v : null],
    );
    if (i === 0) {
      game = c;
      version = v;
    }
    if (i === 1)
      untrackedReport = (
        await post(api, "/api/learning/assignments", {
          classId: classA,
          contentId: c,
          title: "Yalnız açılma raporu",
        })
      ).id;
    if (i === 2) metadataContent = c;
    if (i === 3) reviewVersion = v;
  }
  reportId = (
    await post(api, "/api/learning/assignments", {
      classId: classA,
      contentId: game,
      title: "Çalışma raporu",
    })
  ).id;
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id,progress,score,completed_at,created_at) VALUES($1,$2,$3,100,90,now(),now()-interval '1 hour')",
    [students[0], version, reportId],
  );
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id) VALUES($1,$2,$3)",
    [students[0], version, reportId],
  );
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id,progress,score) VALUES($1,$2,$3,10,0)",
    [students[1], version, reportId],
  );
  const editor = await playwright.request.newContext({ baseURL: origin });
  const editorEmail = `workspace-editor-${randomUUID()}@example.test`;
  await post(editor, "/api/auth/sign-up/email", {
    name: "Atölye İnceleyicisi",
    email: editorEmail,
    password,
  });
  await pool.query(
    "UPDATE users SET email_verified=true,role='editor' WHERE email=$1",
    [editorEmail],
  );
  await post(editor, "/api/auth/sign-in/email", {
    email: editorEmail,
    password,
  });
  const setup = await post(editor, "/api/auth/two-factor/enable", { password });
  await post(editor, "/api/auth/two-factor/verify-totp", {
    code: totp(new URL(setup.totpURI).searchParams.get("secret")!),
  });
  editorAuth = await editor.storageState();
  await api.dispose();
  await editor.dispose();
});
test.beforeEach(async ({ context }) => context.addCookies(auth.cookies));
test.afterAll(async () => pool.end());
test("account forms cannot submit credentials before hydration", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ["/giris", "/kayit?tur=ogrenci"]) {
    await page.goto(origin + route);
    for (const form of await page.locator("form").all()) {
      await expect(form).toHaveAttribute("method", "post");
    }
    await expect(
      page.getByRole("button", {
        name: route === "/giris" ? "Giriş yap" : "Hesabımı oluştur",
        exact: true,
      }),
    ).toBeDisabled();
  }
  await context.close();
});
test("report filters preserve totals, retry semantics, null score and mobile disclosure", async ({
  page,
}) => {
  await page.goto(`/ogretmen/odevler/${reportId}`);
  await expect(
    page.getByRole("button", { name: "50 Atanan öğrenci" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1 Tamamlandı", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "öğrenci gösteriliyor" }),
  ).toContainText("1 / 50");
  await expect(
    page.getByRole("group", { name: "Rapor çıktıları" }).getByRole("status"),
  ).toContainText("1 öğrenci çıktıya alınacak");
  const row = page.getByRole("row").filter({ hasText: "Deniz 00" });
  await expect(row).toContainText("Tamamlandı");
  await expect(row.getByRole("cell").nth(2)).toHaveText("—");
  await expect(row.getByRole("cell").nth(3)).toHaveText("90");
  await page.getByLabel("Öğrenci ara", { exact: true }).fill("bulunmayan");
  await expect(
    page.getByRole("heading", { name: "Bu filtreye uygun öğrenci yok." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filtreleri temizle" }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await capture(page, `report-${width}`);
    if (width < 768) {
      await expect(page.getByRole("table")).toHaveCount(0);
      const detail = page.locator(".report-mobile details").first();
      await detail.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(
        detail.getByText("En iyi puan", { exact: true }),
      ).toBeVisible();
      await detail.locator("summary").press("Enter");
    }
  }
  await page.evaluate(() => (document.body.style.zoom = "2"));
  await capture(page, "report-zoom-200");
  await page.goto(`/ogretmen/odevler/${untrackedReport}`);
  await expect(page.getByRole("button", { name: "50 Açılmadı" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tamamlandı/ })).toHaveCount(0);
});
test("assignment keeps five hidden selections, resets across classes, survives failure and sends exactly once", async ({
  page,
}) => {
  await page.goto(`/ogretmen/odevler?oyun=${game}`);
  await page.getByLabel("Sınıf", { exact: true }).selectOption(classA);
  await chooseGame(page);
  await page
    .getByLabel("Ödev başlığı", { exact: true })
    .fill("Beş kişilik çalışma");
  await page
    .getByLabel("Yönerge", { exact: true })
    .fill("Seçilen öğrenciler için yönerge.");
  await page.getByLabel(/Sınıfın tüm onaylı öğrencileri/).uncheck();
  for (let i = 0; i < 5; i++)
    await page.getByLabel(`Deniz 0${i}`, { exact: true }).check();
  const search = page.getByLabel("Öğrenci ara", { exact: true });
  await search.fill("Deniz 49");
  await expect(page.getByRole("status")).toContainText("5 öğrenci seçildi");
  await page.getByLabel("Yalnız seçilenler").check();
  await expect(page.locator(".student-options label")).toHaveCount(0);
  await search.fill("");
  await expect(page.locator(".student-options label")).toHaveCount(5);
  await page.getByLabel("Sınıf", { exact: true }).selectOption(classB);
  await expect(page.getByRole("status")).toContainText("0 öğrenci seçildi");
  await expect(search).toHaveValue("");
  await page.getByLabel("Sınıf", { exact: true }).selectOption(classA);
  for (let i = 0; i < 5; i++)
    await page.getByLabel(`Deniz 0${i}`, { exact: true }).check();
  await search.fill("Deniz 49");
  await expect(
    page.getByRole("region", { name: "Gönderim özeti" }),
  ).toContainText("5 öğrenci");
  let count = 0;
  await page.route("**/api/learning/assignments", async (route) => {
    count++;
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({
      status: 503,
      json: { error: "Test: yeniden deneyin" },
    });
  });
  await page
    .getByRole("button", { name: "Ödevi ver", exact: true })
    .evaluate((el: HTMLButtonElement) => {
      el.click();
      el.click();
    });
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Test: yeniden deneyin",
  );
  expect(count).toBe(1);
  await expect(page.getByRole("status")).toContainText("5 öğrenci seçildi");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await capture(page, `assignment-${width}`);
  }
  await page.unroute("**/api/learning/assignments");
  await page.getByRole("button", { name: "Ödevi ver", exact: true }).click();
  await expect(page).toHaveURL(/\/ogretmen\/odevler\/[^/]+$/);
  const assigned = (
    await pool.query(
      "SELECT student_id FROM assignment_students WHERE assignment_id=$1",
      [new URL(page.url()).pathname.split("/").at(-1)],
    )
  ).rows
    .map((r) => r.student_id)
    .sort();
  expect(assigned).toEqual(students.slice(0, 5).sort());
});
test("owned content filters, pagination and browser navigation preserve URL state", async ({
  page,
}) => {
  await page.goto("/ogretmen");
  await page
    .getByRole("searchbox", { name: "İçerik başlığı ara" })
    .fill(marker);
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(page.locator(".content-row")).toHaveCount(25);
  await expect(
    page.getByRole("navigation", { name: "Liste sayfaları" }),
  ).toContainText("54 kayıt");
  await page.getByRole("link", { name: "Sonraki", exact: true }).click();
  await expect(page).toHaveURL(/sayfa=2/);
  await page.reload();
  await expect(page.locator(".content-row")).toHaveCount(25);
  await page.getByLabel("Durum", { exact: true }).selectOption("attention");
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(page.locator(".content-row")).toHaveCount(1);
  await expect(page).not.toHaveURL(/sayfa=2/);
  await expect(
    page.getByRole("link", { name: "Bilgileri kontrol et" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/sayfa=2/);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "contents-390");
});
test("metadata outline moves focus and preserves edited fields through save and reload", async ({
  page,
}) => {
  await page.goto(`/ogretmen/icerik/${metadataContent}`);
  await page
    .getByLabel("Oyun başlığı", { exact: true })
    .fill("Güncellenmiş çalışma başlığı");
  await page.getByLabel("Öğretmen açıklaması", { exact: true }).fill("kısa");
  await page
    .getByRole("button", { name: "Açıklamayı kontrol edin (20–3000 karakter)" })
    .click();
  await expect(
    page.getByLabel("Öğretmen açıklaması", { exact: true }),
  ).toBeFocused();
  await page
    .getByLabel("Öğretmen açıklaması", { exact: true })
    .fill(
      "Öğrencilerle parçadan bütüne öğrenmeyi destekleyen ayrıntılı öğretmen açıklaması.",
    );
  await page
    .getByRole("button", { name: "Program ve kazanımlar", exact: true })
    .click();
  await expect(page.getByLabel("Oyun başlığı", { exact: true })).toHaveValue(
    "Güncellenmiş çalışma başlığı",
  );
  await page
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Taslak kaydedildi" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Oyun başlığı", { exact: true })).toHaveValue(
    "Güncellenmiş çalışma başlığı",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "metadata-390");
});
test("review queue filters and assessment summary preserve draft through tabs", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await context.addCookies(editorAuth.cookies);
  await page.goto("/editor");
  await page
    .getByRole("searchbox", { name: "İncelenecek başlık ara" })
    .fill(marker);
  await page.getByLabel("Sınıf", { exact: true }).selectOption("4");
  await page.getByLabel("Ders", { exact: true }).selectOption(subject);
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Liste sayfaları" }),
  ).toContainText("51 kayıt");
  await page.setViewportSize({ width: 1440, height: 900 });
  await capture(page, "queue-1440");
  await page.goto(`/editor/${reviewVersion}`);
  await page.getByRole("tab", { name: "Değerlendirme", exact: true }).click();
  await expect(page.locator(".form-outline")).toContainText("5 başlıktan 0");
  await page
    .getByLabel("Bilimsel doğruluk", { exact: true })
    .selectOption("suitable");
  await expect(page.locator(".form-outline")).toContainText("5 başlıktan 1");
  await page
    .getByLabel("Kullanılabilirlik ve erişilebilirlik", { exact: true })
    .selectOption("suitable");
  await expect(page.locator(".form-outline")).toContainText("5 başlıktan 1");
  await page
    .getByLabel("Kullanılabilirlik ve erişilebilirlik — inceleme notu", {
      exact: true,
    })
    .fill("Klavye ve odak incelendi.");
  await expect(page.locator(".form-outline")).toContainText("5 başlıktan 2");
  await page.getByRole("tab", { name: "Teknik inceleme", exact: true }).click();
  await page.getByRole("tab", { name: "Değerlendirme", exact: true }).click();
  await expect(
    page.getByLabel("Bilimsel doğruluk", { exact: true }),
  ).toHaveValue("suitable");
  await page
    .getByRole("button", { name: "Teknik uyarılar", exact: true })
    .click();
  await expect(
    page.getByLabel("Uyarı kararı — a11y.keyboard", { exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "assessment-390");
});
test("student first-use follows real membership and archive states", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  const username = "first_" + randomUUID().slice(0, 8);
  const code = (
    await pool.query("SELECT join_code FROM classrooms WHERE id=$1", [classB])
  ).rows[0].join_code;
  await post(page.request, "/api/auth/student/register", {
    name: "İlk Öğrenci",
    username,
    password,
    classCode: code,
  });
  const id = (
    await pool.query("SELECT user_id FROM student_profiles WHERE username=$1", [
      username,
    ])
  ).rows[0].user_id;
  await pool.query("DELETE FROM classroom_members WHERE student_id=$1", [id]);
  await page.goto("/ogrenci");
  await expect(
    page.getByRole("link", { name: "Sınıf koduyla katıl" }),
  ).toBeVisible();
  await pool.query(
    "INSERT INTO classroom_members(class_id,student_id,status) VALUES($1,$2,'pending')",
    [classB, id],
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Öğretmen onayı bekleniyor." }),
  ).toBeVisible();
  await pool.query(
    "UPDATE classroom_members SET status='active' WHERE class_id=$1 AND student_id=$2",
    [classB, id],
  );
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Öğretmeninden ilk ödevini bekliyorsun.",
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "student-start-390");
  await pool.query("UPDATE classrooms SET archived=true WHERE id=$1", [classB]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Etkin bir sınıf üyeliğin yok." }),
  ).toBeVisible();
  await pool.query("UPDATE classrooms SET archived=false WHERE id=$1", [
    classB,
  ]);
});
test("teacher first-use advances through real class, copy, approval and assignment states", async ({
  page,
  context,
  playwright,
}) => {
  await context.clearCookies();
  const email = `start-${randomUUID()}@example.test`;
  await post(page.request, "/api/auth/sign-up/email", {
    name: "İlk Öğretmen",
    email,
    password,
  });
  await pool.query("UPDATE users SET email_verified=true WHERE email=$1", [
    email,
  ]);
  await post(page.request, "/api/auth/sign-in/email", { email, password });
  await page.goto("/ogretmen/siniflar");
  const guide = page.getByRole("complementary", { name: "Sıradaki adım" });
  await expect(guide).toContainText("İlk sınıfınızı oluşturun");
  await page.getByLabel("Sınıf adı", { exact: true }).fill("İlk 4-C sınıfı");
  await page
    .getByRole("button", { name: "Sınıf oluştur", exact: true })
    .click();
  await expect(guide).toContainText("Katılım kodunu paylaşın");
  const teacherData = await (
      await page.request.get("/api/learning/teacher")
    ).json(),
    cls = teacherData.classes[0];
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin,
  });
  await page.getByRole("button", { name: "Kodu kopyala", exact: true }).click();
  await expect(
    page.locator(".copy-class-code").getByRole("status"),
  ).toContainText("Kod kopyalandı");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    cls.join_code,
  );
  await expect(guide).toContainText("Katılım kodunu paylaşın");
  const student = await playwright.request.newContext({ baseURL: origin });
  const username = "start_" + randomUUID().slice(0, 8);
  await post(student, "/api/auth/student/register", {
    name: "Yeni Öğrenci",
    username,
    password,
    classCode: cls.join_code,
  });
  await page.reload();
  await expect(guide).toContainText("Katılım isteklerini onaylayın");
  await page.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(guide).toContainText("İlk ödevinizi verin");
  const assignment = await post(page.request, "/api/learning/assignments", {
    classId: cls.id,
    contentId: game,
    title: "İlk çalışma",
  });
  await page.reload();
  await expect(
    guide.getByRole("link", { name: "Ödev sonuçlarını gör" }),
  ).toHaveAttribute("href", `/ogretmen/odevler/${assignment.id}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "teacher-start-390");
  await student.dispose();
});

test("optional cover previews remain local, validate size and can be removed", async ({
  page,
}) => {
  await page.goto("/ogretmen/yeni");
  const input = page.getByLabel("Kapak görseli (isteğe bağlı)", {
    exact: true,
  });
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=",
    "base64",
  );
  await input.setInputFiles({
    name: "kapak.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.getByAltText("Seçilen kapak önizlemesi")).toBeVisible();
  await expect(page.locator(".cover-file-selected")).toContainText(
    "Henüz yüklenmedi",
  );
  await page.getByRole("button", { name: "Kaldır", exact: true }).click();
  await expect(input).toBeFocused();
  expect(await input.evaluate((el: HTMLInputElement) => el.files?.length)).toBe(
    0,
  );
  await input.setInputFiles({
    name: "buyuk.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(
    page.locator(".cover-file-picker").getByRole("alert"),
  ).toContainText("en fazla 5 MB");
  expect(await input.evaluate((el: HTMLInputElement) => el.files?.length)).toBe(
    0,
  );
  await input.setInputFiles({
    name: "kapak.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(
    page.locator(".cover-file-picker").getByRole("alert"),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "cover-selection-390");
});

test("copy confirmation waits for clipboard success and keeps a manual fallback on denial", async ({
  page,
}) => {
  await page.goto("/ogretmen/siniflar");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    });
  });
  const code = page.locator(".copy-class-code").first();
  await code.getByRole("button", { name: "Kodu kopyala", exact: true }).click();
  await expect(code.getByRole("status")).toContainText(
    "elle kopyalayabilirsin",
  );
  await expect(
    code.getByRole("button", { name: "Kopyalandı", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            (window as any).finishCopy = resolve;
          }),
      },
    });
  });
  await code.getByRole("button", { name: "Kodu kopyala", exact: true }).click();
  await expect(code.getByRole("button")).toBeDisabled();
  await expect(
    code.getByRole("button", { name: "Kopyalandı", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => (window as any).finishCopy());
  await expect(
    code.getByRole("button", { name: "Kopyalandı", exact: true }),
  ).toBeVisible();
});

test("player save feedback distinguishes pending, acknowledged and rejected writes", async ({
  page,
  context,
}) => {
  const dashboard = await (
    await page.request.get("/api/learning/teacher")
  ).json();
  const cls = dashboard.classes.find((c: { id: string }) => c.id === classA);
  await context.clearCookies();
  await post(page.request, "/api/auth/student/register", {
    name: "Kayıt Geri Bildirimi",
    username: "save_" + randomUUID().slice(0, 8),
    password,
    classCode: cls.join_code,
  });
  const sessionId = randomUUID();
  const gameUrl = "http://feedback.games.localhost:58087/nonhome-feedback-game";
  await page.route("**/api/learning/play", (route) =>
    route.fulfill({
      json: {
        sessionId,
        gameUrl,
        title: "Kayıt geri bildirimi",
        tracking: true,
        state: null,
        revision: 0,
        progress: null,
        score: null,
        completed: false,
      },
    }),
  );
  await page.route(gameUrl, (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="tr"><head><meta charset="utf-8"></head><body><button disabled>Kaydı gönder</button><script>
    let session, revision = 0, count = 0;
    const send = data => parent.postMessage({app:'dijitalatolye:v1',nonce:'feedback-nonce',...data}, '*');
    addEventListener('message', event => { if(event.data.type==='init'){session=event.data.sessionId;revision=event.data.revision;document.querySelector('button').disabled=false;} if(event.data.type==='ack')revision=event.data.revision ?? revision; });
    document.querySelector('button').onclick=()=>{const requestId='write-'+(++count);send({type:'pending',sessionId:session,requestId});send({type:'save',sessionId:session,requestId,revision,state:{step:1},progress:50,score:0,complete:false});};
    send({type:'ready'});
  </script></body></html>`,
    }),
  );
  let reject = false;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/learning/play/${sessionId}`, async (route) => {
    if (!reject) await pending;
    await route.fulfill({
      status: reject ? 409 : 200,
      json: reject
        ? { error: "Kayıt güncellendi. Yeniden yükle." }
        : { revision: 1 },
    });
  });
  await page.goto(`/ogrenci/oyna/${game}`);
  const notice = page.locator(".player-save-status");
  await expect(notice).toHaveAttribute("data-state", "ready");
  await page
    .frameLocator("iframe")
    .getByRole("button", { name: "Kaydı gönder" })
    .click();
  await expect(notice).toHaveAttribute("data-state", "pending");
  await expect(notice).toHaveText("Kaydediliyor…");
  release();
  await expect(notice).toHaveAttribute("data-state", "saved");
  await expect(notice).toHaveText("Kaydedildi.");
  reject = true;
  await page
    .frameLocator("iframe")
    .getByRole("button", { name: "Kaydı gönder" })
    .click();
  await expect(notice).toHaveAttribute("data-state", "error");
  await expect(notice).toContainText("Yeniden yükle");
  await expect(
    page.getByRole("button", { name: "Güncel kaydı yükle", exact: true }),
  ).toBeVisible();
});

test("cover images reserve space while loading and replace failed images with a readable fallback", async ({
  page,
}) => {
  let broken = false;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/versions/*/cover/image?*", async (route) => {
    if (broken) {
      await route.fulfill({ status: 404, body: "Unavailable test cover" });
      return;
    }
    await pending;
    await route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });
  await page.goto(`/ogretmen/icerik/${metadataContent}`);
  const cover = page.locator(".cover-editor .cover-image-frame");
  await expect(cover).toHaveAttribute("data-state", "loading");
  await expect(cover.getByRole("status")).toHaveText("Kapak yükleniyor…");
  const loadingSize = await cover.boundingBox();
  release();
  await expect(cover).toHaveAttribute("data-state", "ready");
  await expect(cover.getByRole("img")).toBeVisible();
  const loadedSize = await cover.boundingBox();
  expect(loadedSize?.height).toBeCloseTo(loadingSize!.height, 0);
  broken = true;
  await page.reload();
  await expect(cover).toHaveAttribute("data-state", "error");
  await expect(cover.getByRole("status")).toHaveText("Kapak gösterilemiyor.");
  await expect(cover.getByRole("img")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Otomatik kapak kullan", exact: true }),
  ).toBeEnabled();
});
