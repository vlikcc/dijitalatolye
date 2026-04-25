import { useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";

interface CreateContentResponse { id: string; state: string }
interface PresignedResponse { url: string; bucket: string; key: string }

export default function TeacherUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ title: "", description: "", subject: "Bilişim", gradeLevel: 5, tags: "", outcomes: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setStatus(""); setError(null);
    try {
      setStatus("İçerik kaydı oluşturuluyor...");
      const { data: created } = await api.post<CreateContentResponse>("/contents", {
        title: meta.title,
        description: meta.description,
        subject: meta.subject,
        gradeLevel: Number(meta.gradeLevel),
        outcomeCodes: meta.outcomes.split(",").map(s => s.trim()).filter(Boolean),
        tags: meta.tags.split(",").map(s => s.trim()).filter(Boolean),
      });

      setStatus("Yükleme adresi alınıyor...");
      const { data: presigned } = await api.post<PresignedResponse>("/storage/uploads/presigned", {
        fileName: file.name,
        contentType: "application/zip",
        purpose: "content",
      });

      setStatus("Dosya MinIO'ya yükleniyor...");
      await axios.put(presigned.url, file, { headers: { "Content-Type": "application/zip" } });

      setStatus("Versiyon kaydı oluşturuluyor...");
      await api.post(`/contents/${created.id}/versions`, {
        bucket: presigned.bucket,
        key: presigned.key,
        manifestEntry: "index.html",
        manifestJson: null,
        fileSizeBytes: file.size,
        sha256: null,
        changeLog: "İlk versiyon",
      });

      setStatus("İncelemeye gönderiliyor...");
      await api.post(`/contents/${created.id}/submit`);
      setStatus("Tamamlandı! AI moderasyonu başladı, sonucu bekleyin.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Yeni İçerik Yükle</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input placeholder="Başlık" value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          required className="w-full px-3 py-2 border rounded" />
        <textarea placeholder="Kısa açıklama" value={meta.description}
          onChange={(e) => setMeta({ ...meta, description: e.target.value })}
          className="w-full px-3 py-2 border rounded" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Ders" value={meta.subject}
            onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
            className="px-3 py-2 border rounded" />
          <input type="number" min={1} max={12} placeholder="Sınıf seviyesi" value={meta.gradeLevel}
            onChange={(e) => setMeta({ ...meta, gradeLevel: Number(e.target.value) })}
            className="px-3 py-2 border rounded" />
        </div>
        <input placeholder="Kazanım kodları (virgülle)" value={meta.outcomes}
          onChange={(e) => setMeta({ ...meta, outcomes: e.target.value })}
          className="w-full px-3 py-2 border rounded" />
        <input placeholder="Etiketler (virgülle)" value={meta.tags}
          onChange={(e) => setMeta({ ...meta, tags: e.target.value })}
          className="w-full px-3 py-2 border rounded" />
        <input type="file" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required className="w-full" />
        {status && <p className="text-sm text-slate-700">{status}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy || !file}
          className="px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-60">
          {busy ? "İşleniyor..." : "Gönder"}
        </button>
      </form>
    </section>
  );
}
