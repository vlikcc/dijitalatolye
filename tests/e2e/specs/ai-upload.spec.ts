import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as zlib from 'node:zlib';

const TIMESTAMP = Date.now();
const TEACHER_EMAIL = `teacher${TIMESTAMP}@meb.k12.tr`;
const TEACHER_PASSWORD = 'Test1234!';

/**
 * AI destekli yükleme akışının end-to-end smoke testi.
 *
 * Beklenen davranış:
 * 1. Öğretmen kayıt + giriş
 * 2. /teacher/contents/new sayfasında dropzone gözükür
 * 3. Geçerli bir ZIP yüklendiğinde "AI içeriği analiz ediyor" progress bar görünür
 * 4. AI cevabı geldikten sonra form alanları doldurulmuş şekilde açılır (Title vs.)
 * 5. Form'un yanında "AI Önerisi" rozeti görünür
 * 6. "Kaydet ve İncelemeye Gönder" → /teacher/contents'e yönlendirir
 *
 * Backend bağımlılıkları: gateway:5000 üzerinden /api/auth/login, /api/contents/ai-extract.
 * DeepSeek API key boşsa endpoint manifest title fallback yapar — test bu durumda
 * "AI Önerisi" rozetini görmeyebilir, sadece form fazına geçişi doğrular.
 */
test.describe('AI destekli upload akışı', () => {
  test.skip(({ }, testInfo) => !process.env.E2E_RUN_UPLOAD,
    'Yükleme akışı varsayılan olarak atlandı; E2E_RUN_UPLOAD=1 ile aç.');

  test('öğretmen ZIP yükler, AI alanları doldurulur, gönderim başarılı', async ({ page }) => {
    // 1) Kayıt + giriş
    await page.goto('/register');
    await page.getByPlaceholder('ornek@meb.gov.tr').fill(TEACHER_EMAIL);
    await page.getByPlaceholder('En az 8 karakter').fill(TEACHER_PASSWORD);
    await page.getByPlaceholder('Ayşe Yılmaz').fill('Test Öğretmen');
    await page.getByRole('button', { name: /kayit ol|kayıt ol/i }).click();

    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await page.getByPlaceholder('ornek@meb.gov.tr').fill(TEACHER_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEACHER_PASSWORD);
    await page.getByRole('button', { name: /giri[şs] yap/i }).click();

    // 2) Upload sayfasına git
    await page.waitForURL(/\/(teacher\/contents\/new|teacher\/dashboard)/, { timeout: 15_000 });
    if (!page.url().endsWith('/teacher/contents/new')) {
      await page.goto('/teacher/contents/new');
    }

    // 3) Bir minimal ZIP hazırla
    const zipPath = await createSampleZip();

    // 4) Dosyayı seç (hidden input)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(zipPath);

    // 5) Extracting fazını gör
    await expect(page.getByText(/AI içeriği analiz ediyor/i)).toBeVisible({ timeout: 5_000 });

    // 6) Form fazına geçildiğini doğrula
    await expect(page.getByText(/AI Önerileri/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('input[formcontrolname="title"]')).not.toHaveValue('');

    // 7) Submit
    await page.getByRole('button', { name: /Kaydet ve İncelemeye Gönder/i }).click();
    await page.waitForURL(/\/teacher\/contents$/, { timeout: 30_000 });

    // 8) Listede yeni içerik göründü mü
    await expect(page.getByText(/Submitted|Gönderildi|İncelemede/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

/**
 * Minimal geçerli bir bundle ZIP üretir: manifest.json + index.html.
 * Node.js'in built-in `zlib`/`fs` yetenekleriyle ham deflate ZIP yazmak yerine,
 * basitlik adına standart bir küçük arşiv `zlib.deflateRawSync` kullanılarak yazılır.
 * (Test ortamında çalışan dotnet ZipArchive'ın okuyabildiği STORED entry.)
 */
async function createSampleZip(): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'da-upload-'));
  const zipPath = path.join(tmpDir, 'sample-bundle.zip');

  const manifest = Buffer.from(JSON.stringify({
    entry: 'index.html',
    title: '5. Sınıf Doğal Sayılar Etkinliği',
    version: '1.0',
  }));
  const html = Buffer.from(`<!doctype html><html><head><title>Doğal Sayılar</title></head>
<body><h1>5. Sınıf Matematik</h1><h2>Basamak Değeri</h2>
<p>Bu etkinlikte öğrenciler basamak değerini örnekler üzerinden keşfeder.</p></body></html>`);

  fs.writeFileSync(zipPath, buildZip([
    { name: 'manifest.json', data: manifest },
    { name: 'index.html', data: html },
  ]));
  return zipPath;
}

interface ZipEntry { name: string; data: Buffer; }

function buildZip(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = Buffer.from(e.name, 'utf-8');
    const crc = crc32(e.data);
    // STORED method (no compression) — testin ZipArchive ile okunabilirliğini sağlar.
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);          // local file signature
    local.writeUInt16LE(20, 4);                  // version needed
    local.writeUInt16LE(0, 6);                   // flags
    local.writeUInt16LE(0, 8);                   // method = STORED
    local.writeUInt16LE(0, 10);                  // mod time
    local.writeUInt16LE(0, 12);                  // mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.data.length, 18);      // compressed size
    local.writeUInt32LE(e.data.length, 22);      // uncompressed size
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);                  // extra length
    nameBytes.copy(local, 30);

    localParts.push(local, e.data);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(e.data.length, 20);
    central.writeUInt32LE(e.data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);                // extra
    central.writeUInt16LE(0, 32);                // comment
    central.writeUInt16LE(0, 34);                // disk
    central.writeUInt16LE(0, 36);                // internal attrs
    central.writeUInt32LE(0, 38);                // external attrs
    central.writeUInt32LE(offset, 42);
    nameBytes.copy(central, 46);
    centralParts.push(central);

    offset += local.length + e.data.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, end]);
}

function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (~crc) >>> 0;
}

// zlib unused (STORED only); referans için imports temizlenebilir
void zlib;
