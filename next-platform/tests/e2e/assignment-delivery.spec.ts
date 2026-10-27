import {
  test,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const origin = process.env.APP_URL!;
const output = ".impeccable/review/assignment-delivery";
let auth: Awaited<ReturnType<BrowserContext["storageState"]>>;
let source: string,
  targetClass: string,
  otherClass: string,
  content: string,
  current: string,
  unavailable: string,
  untracked: string;
const students: string[] = [];
const title = 'Kesirler; "yeniden"';
const instructions = "Üç tur oynayın.\nSonucu birlikte değerlendirelim.";
async function post(api: APIRequestContext, path: string, data: unknown) {
  const r = await api.post(path, { headers: { origin }, data });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
test.beforeAll(async ({ playwright }) => {
  if (
    !new URL(process.env.DATABASE_URL!).pathname.endsWith("_test") ||
    !["localhost", "127.0.0.1"].includes(new URL(origin).hostname)
  )
    throw Error("Dedicated local test database required");
  await mkdir(output, { recursive: true });
  const api = await playwright.request.newContext({ baseURL: origin });
  const email = `delivery-${randomUUID()}@example.test`,
    password = `Delivery-${randomUUID()}`;
  await post(api, "/api/auth/sign-up/email", {
    name: "Rapor Öğretmeni",
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
  const sourceClass = (
    await post(api, "/api/learning/classes", { name: "Eski 4-A" })
  ).id;
  targetClass = (await post(api, "/api/learning/classes", { name: "Yeni 4-B" }))
    .id;
  otherClass = (await post(api, "/api/learning/classes", { name: "Yeni 4-C" }))
    .id;
  for (let i = 0; i < 50; i++) {
    const id = randomUUID();
    students.push(id);
    const name =
      i === 0
        ? "Çağrı Işık"
        : i === 1
          ? '  =HYPERLINK("örnek")'
          : `Öğrenci ${String(i).padStart(2, "0")}`;
    await pool.query(
      "INSERT INTO users(id,name,email,role) VALUES($1,$2,$3,'student')",
      [id, name, `${id}@student.invalid`],
    );
    await pool.query(
      "INSERT INTO student_profiles(user_id,username) VALUES($1,$2)",
      [id, `ogrenci_${id.slice(0, 8)}`],
    );
    for (const cls of [sourceClass, targetClass, otherClass])
      await pool.query(
        "INSERT INTO classroom_members(class_id,student_id,status) VALUES($1,$2,'active')",
        [cls, id],
      );
  }
  async function game(tracking: boolean) {
    const id = randomUUID(),
      version = randomUUID();
    await pool.query(
      "INSERT INTO contents(id,owner_id,slug) VALUES($1,$2,$3)",
      [id, teacher, `delivery-${id}`],
    );
    await pool.query(
      "INSERT INTO content_versions(id,content_id,sha256,format,state,metadata,scan_report,tracking) VALUES($1,$2,$3,'html','published',$4,$5,$6)",
      [
        version,
        id,
        "b".repeat(64),
        { title: tracking ? "Kesir alıştırması" : "Açılma oyunu" },
        { status: "clean" },
        tracking,
      ],
    );
    await pool.query(
      "UPDATE contents SET published_version_id=$2 WHERE id=$1",
      [id, version],
    );
    return { id, version };
  }
  const g = await game(true);
  content = g.id;
  source = (
    await post(api, "/api/learning/assignments", {
      classId: sourceClass,
      contentId: content,
      title,
      instructions,
      dueAt: "2026-09-01T10:00:00Z",
    })
  ).id;
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id,score,progress) VALUES($1,$2,$3,0,10)",
    [students[0], g.version, source],
  );
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id,score,progress,completed_at,created_at) VALUES($1,$2,$3,80,100,now(),now()-interval '1 hour')",
    [students[1], g.version, source],
  );
  await pool.query(
    "INSERT INTO game_attempts(student_id,version_id,assignment_id) VALUES($1,$2,$3)",
    [students[1], g.version, source],
  );
  current = randomUUID();
  await pool.query(
    "INSERT INTO content_versions(id,content_id,sha256,format,state,metadata,scan_report,tracking) VALUES($1,$2,$3,'html','published',$4,$5,true)",
    [
      current,
      content,
      "c".repeat(64),
      { title: "Kesir alıştırması — güncel" },
      { status: "clean" },
    ],
  );
  await pool.query("UPDATE contents SET published_version_id=$2 WHERE id=$1", [
    content,
    current,
  ]);
  const removed = await game(true);
  unavailable = (
    await post(api, "/api/learning/assignments", {
      classId: sourceClass,
      contentId: removed.id,
      title: "Kaldırılmış oyun ödevi",
      instructions,
    })
  ).id;
  await pool.query(
    "UPDATE contents SET published_version_id=NULL WHERE id=$1",
    [removed.id],
  );
  const plain = await game(false);
  untracked = (
    await post(api, "/api/learning/assignments", {
      classId: sourceClass,
      contentId: plain.id,
      title: "Açılma ödevi",
    })
  ).id;
  await post(api, `/api/learning/assignments/${source}`, { action: "close" });
  await post(api, `/api/learning/classes/${sourceClass}`, {
    action: "archive",
  });
  await writeFile(
    ".data/assignment-safari-fixture.json",
    JSON.stringify({
      email,
      password,
      source,
      targetClass,
      unavailable,
      untracked,
    }),
    { mode: 0o600 },
  );
  await api.dispose();
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(auth.cookies);
});
test.afterAll(async () => {
  await pool.end();
});

test("reuse resets recipients/date, submits one fresh assignment with current game and preserves original", async ({
  page,
}) => {
  const previous = (
    await pool.query("SELECT * FROM assignments WHERE id=$1", [source])
  ).rows[0];
  await page.goto(`/ogretmen/odevler/${source}`);
  await page.getByRole("link", { name: "Yeniden kullan", exact: true }).click();
  await expect(page.getByLabel("Ödev başlığı")).toHaveValue(title);
  await expect(page.getByLabel("Yönerge")).toHaveValue(instructions);
  await expect(page.getByLabel("Son tarih (isteğe bağlı)")).toHaveValue("");
  await expect(
    page.getByRole("combobox", { name: "Sınıf", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("combobox", { name: "Oyun", exact: true }),
  ).toHaveValue("Kesir alıştırması — güncel");
  await expect(page.getByText(/Oyun güncellenmiş/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ödevi ver", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Sınıf", exact: true })
    .selectOption(targetClass);
  await expect(
    page.getByLabel(/Sınıfın tüm onaylı öğrencileri/),
  ).not.toBeChecked();
  await page.getByLabel("Çağrı Işık", { exact: true }).check();
  await page
    .getByRole("combobox", { name: "Sınıf", exact: true })
    .selectOption(otherClass);
  await expect(
    page.getByLabel("Çağrı Işık", { exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("combobox", { name: "Sınıf", exact: true })
    .selectOption(targetClass);
  await page.getByLabel("Çağrı Işık", { exact: true }).check();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await capture(page, `reuse-${width}`);
  }
  await page.getByRole("button", { name: "Ödevi ver", exact: true }).click();
  await expect(page).toHaveURL(/\/ogretmen\/odevler\/[a-f0-9-]+$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  expect(id).not.toBe(source);
  expect(
    (await pool.query("SELECT * FROM assignments WHERE id=$1", [id])).rows[0],
  ).toMatchObject({
    version_id: current,
    due_at: null,
    closed: false,
    class_id: targetClass,
    title,
    instructions,
  });
  expect(
    (
      await pool.query(
        "SELECT student_id FROM assignment_students WHERE assignment_id=$1",
        [id],
      )
    ).rows,
  ).toEqual([{ student_id: students[0] }]);
  expect(
    (
      await pool.query("SELECT * FROM game_attempts WHERE assignment_id=$1", [
        id,
      ])
    ).rows,
  ).toHaveLength(0);
  expect(
    (await pool.query("SELECT * FROM assignments WHERE id=$1", [source]))
      .rows[0],
  ).toEqual(previous);
});

test("unavailable game keeps text and changing source resets edited form", async ({
  page,
}) => {
  await page.goto(`/ogretmen/odevler?yeniden=${unavailable}&oyun=${content}`);
  await expect(page.getByLabel("Ödev başlığı")).toHaveValue(
    "Kaldırılmış oyun ödevi",
  );
  await expect(page.getByLabel("Yönerge")).toHaveValue(instructions);
  await expect(
    page.getByRole("combobox", { name: "Oyun", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByText(/Bağlantıdaki oyun artık atanamıyor/),
  ).toBeVisible();
  await page.getByLabel("Ödev başlığı").fill("Düzenlenmiş başlık");
  await page.locator(`a[href="/ogretmen/odevler?yeniden=${source}"]`).click();
  await expect(page.getByLabel("Ödev başlığı")).toHaveValue(title);
  await expect(
    page.getByRole("combobox", { name: "Sınıf", exact: true }),
  ).toHaveValue("");
  const game = page.getByRole("combobox", { name: "Oyun", exact: true });
  await game.focus();
  await game.press("ArrowDown");
  await game.press("Escape");
  await expect(game).toBeFocused();
});

test("invalid and foreign sources show not found without exposing fields", async ({
  page,
  playwright,
}) => {
  await page.goto("/ogretmen/odevler?yeniden=invalid");
  await expect(
    page.getByRole("heading", { name: "Bu içerik burada değil." }),
  ).toBeVisible();
  const api = await playwright.request.newContext({ baseURL: origin });
  const email = `outsider-${randomUUID()}@example.test`,
    password = `Outside-${randomUUID()}`;
  await post(api, "/api/auth/sign-up/email", {
    name: "Başka Öğretmen",
    email,
    password,
  });
  await pool.query("UPDATE users SET email_verified=true WHERE email=$1", [
    email,
  ]);
  await post(api, "/api/auth/sign-in/email", { email, password });
  await page.context().clearCookies();
  await page.context().addCookies((await api.storageState()).cookies);
  await page.goto(`/ogretmen/odevler?yeniden=${source}`);
  await expect(
    page.getByRole("heading", { name: "Bu içerik burada değil." }),
  ).toBeVisible();
  await expect(page.getByLabel("Ödev başlığı")).toHaveCount(0);
  await api.dispose();
});

test("CSV downloads filtered/all rows with safe text, zero and missing values", async ({
  page,
}) => {
  await page.goto(`/ogretmen/odevler/${source}`);
  await page.getByLabel("Öğrenci ara").fill("ışık");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  const file = await download;
  await file.saveAs(`${output}/filtered-report.csv`);
  const bytes = await readFile(await file.path());
  expect([...bytes.subarray(0, 3)]).toEqual([239, 187, 191]);
  const csv = bytes.toString("utf8");
  expect(csv.split("\r\n")).toHaveLength(3);
  expect(csv).toContain('"Çağrı Işık"');
  expect(csv).toContain('"10";"0";"0";"1";');
  expect(csv).toContain('"Kesirler; ""yeniden"""');
  await page.getByLabel("Çıktı kapsamı").selectOption("all");
  const allDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  const allFile = await allDownload;
  await allFile.saveAs(`${output}/all-report.csv`);
  const allCsv = await readFile(await allFile.path(), "utf8");
  expect(allCsv.split("\r\n")).toHaveLength(52);
  expect(allCsv).toContain('"\'  =HYPERLINK(""örnek"")"');
  expect(allCsv).toContain('"";"";"80";"2";');
  await page.getByLabel("Çıktı kapsamı").selectOption("filtered");
  await page.getByLabel("Öğrenci ara").fill("eşleşmeyen öğrenci");
  await expect(page.getByRole("button", { name: "CSV indir" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Yazdır / PDF" }),
  ).toBeDisabled();
  await page.getByLabel("Çıktı kapsamı").selectOption("all");
  await expect(page.getByRole("button", { name: "CSV indir" })).toBeEnabled();
});

test("print has all columns on mobile, current scope/order, no duplicate UI and multiple pages", async ({
  page,
}) => {
  await page.goto(`/ogretmen/odevler/${source}`);
  await page.getByLabel("Öğrenci ara").fill("ışık");
  await page.getByLabel("Sıralama", { exact: true }).selectOption("activity");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await capture(page, `exports-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.print = () => {
      window.dispatchEvent(new Event("beforeprint"));
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  await page.getByRole("button", { name: "Yazdır / PDF" }).click();
  await expect(page.getByLabel("Öğrenci ara")).toHaveValue("ışık");
  await page.emulateMedia({ media: "print" });
  const printed = page.getByRole("region", {
    name: "Yazdırılabilir ödev raporu",
  });
  await expect(printed).toBeVisible();
  await expect(printed.locator("tbody tr")).toHaveCount(1);
  await expect(printed.getByRole("columnheader")).toHaveCount(8);
  await expect(page.getByRole("button", { name: "CSV indir" })).toBeHidden();
  await expect(page.locator(".report-mobile")).toBeHidden();
  await expect(printed).toContainText("İstanbul");
  await page.pdf({
    path: `${output}/filtered-report.pdf`,
    preferCSSPageSize: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByLabel("Çıktı kapsamı").selectOption("all");
  await page.getByRole("button", { name: "Yazdır / PDF" }).click();
  await page.emulateMedia({ media: "print" });
  await expect(printed.locator("tbody tr")).toHaveCount(50);
  await expect(printed.locator("tbody tr").first()).toContainText("HYPERLINK");
  await page.pdf({ path: `${output}/all-report.pdf`, preferCSSPageSize: true });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: "Ödevlere dön" }).click();
  await expect(page.locator(".assignment-print")).toHaveCount(0);
});

test("untracked CSV and print explicitly omit performance data", async ({
  page,
}) => {
  await page.goto(`/ogretmen/odevler/${untracked}`);
  await page.getByLabel("Öğrenci ara").fill("ışık");
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  const csv = await readFile(await (await waiting).path(), "utf8");
  expect(csv).toContain("Yalnızca açılma bilgisi");
  expect(csv).toContain(';"";"";"";"0";""');
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".assignment-print")).toContainText(
    "Tamamlanma, puan ve ilerleme ölçülemez.",
  );
});
