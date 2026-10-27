export async function createUploadContent(): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    throw Error(
      "İçerik kaydı oluşturulurken bağlantı kesildi. Yeniden denemeden önce İçeriklerim listesini kontrol edin.",
    );
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw Error(
      "İçerik kaydı için sunucu yanıtı okunamadı. Yeniden denemeden önce İçeriklerim listesini kontrol edin.",
    );
  }
  if (!response.ok)
    throw Error(
      typeof body?.error === "string"
        ? body.error
        : `İçerik kaydı oluşturulamadı (HTTP ${response.status}).`,
    );
  if (typeof body?.id !== "string" || !body.id.trim())
    throw Error(
      "İçerik kaydı doğrulanamadı. Yeniden denemeden önce İçeriklerim listesini kontrol edin.",
    );
  return body.id;
}

/** Only an acknowledged, nonempty version ID makes a package upload successful. */
export function readUploadResponse(
  status: number,
  response: string,
): { versionId: string } {
  let body: { versionId?: unknown; error?: unknown; traceId?: unknown };
  try {
    body = JSON.parse(response);
  } catch {
    throw Error(
      status >= 200 && status < 300
        ? "Sunucu yanıtı okunamadı; yükleme sonucu doğrulanamadı. Yeniden yüklemeden önce içerik kaydını kontrol edin."
        : `Sunucu yüklemeyi tamamlayamadı (HTTP ${status}). Lütfen daha sonra tekrar deneyin.`,
    );
  }
  if (status < 200 || status >= 300)
    throw Error(
      (typeof body?.error === "string"
        ? body.error
        : `Sunucu yüklemeyi tamamlayamadı (HTTP ${status}).`) +
        (typeof body?.traceId === "string" ? ` (İzleme: ${body.traceId})` : ""),
    );
  if (!body || typeof body.versionId !== "string" || !body.versionId.trim())
    throw Error(
      "Sunucu yüklemeyi doğrulayan sürüm kimliğini göndermedi. Yeniden yüklemeden önce içerik kaydını kontrol edin.",
    );
  return { versionId: body.versionId };
}

export function uploadPackage(
  contentId: string,
  file: File,
  onProgress: (percent: number) => void,
  onTransferred: () => void,
): Promise<{ versionId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/contents/${encodeURIComponent(contentId)}/versions`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0)
        onProgress(Math.floor((event.loaded / event.total) * 100));
    };
    xhr.upload.onload = onTransferred;
    xhr.onerror = () =>
      reject(
        Error(
          "Bağlantı kesildi; dosyanın kaydedilip kaydedilmediği doğrulanamadı. Yeniden yüklemeden önce içerik kaydını kontrol edin.",
        ),
      );
    xhr.onabort = () =>
      reject(
        Error(
          "Aktarım durduruldu. Yeniden yüklemeden önce içerik kaydını kontrol edin.",
        ),
      );
    xhr.onload = () => {
      try {
        resolve(readUploadResponse(xhr.status, xhr.responseText));
      } catch (e) {
        reject(e);
      }
    };
    const data = new FormData();
    data.set("archive", file);
    xhr.send(data);
  });
}

/** Cover is secondary; every failure is handled after the acknowledged package save. */
export async function uploadOptionalCover(
  contentId: string,
  versionId: string,
  thumbnail: File,
): Promise<void> {
  const response = await fetch(
    `/api/contents/${encodeURIComponent(contentId)}`,
  );
  if (!response.ok) throw Error("Kapak için sürüm bilgisi alınamadı.");
  const current = await response.json();
  const uploaded = Array.isArray(current?.versions)
    ? current.versions.find((v: { id?: string }) => v?.id === versionId)
    : null;
  if (
    !uploaded ||
    typeof uploaded.sha256 !== "string" ||
    !Number.isInteger(uploaded.metadataRevision)
  )
    throw Error("Kapak için sürüm bilgisi doğrulanamadı.");
  const result = await fetch(
    `/api/versions/${encodeURIComponent(versionId)}/thumbnail`,
    {
      method: "POST",
      headers: {
        "Content-Type": thumbnail.type,
        "X-Package-Sha256": uploaded.sha256,
        "X-Metadata-Revision": String(uploaded.metadataRevision),
        "X-Cover-Revision": String(uploaded.cover?.revision ?? 0),
      },
      body: thumbnail,
    },
  );
  if (!result.ok) throw Error("Kapak eklenemedi.");
}
