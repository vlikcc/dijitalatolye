import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
export default function TeacherUploadPage() {
    const [file, setFile] = useState(null);
    const [meta, setMeta] = useState({ title: "", description: "", subject: "Bilişim", gradeLevel: 5, tags: "", outcomes: "" });
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        if (!file)
            return;
        setBusy(true);
        setStatus("");
        setError(null);
        try {
            setStatus("İçerik kaydı oluşturuluyor...");
            const { data: created } = await api.post("/contents", {
                title: meta.title,
                description: meta.description,
                subject: meta.subject,
                gradeLevel: Number(meta.gradeLevel),
                outcomeCodes: meta.outcomes.split(",").map(s => s.trim()).filter(Boolean),
                tags: meta.tags.split(",").map(s => s.trim()).filter(Boolean),
            });
            setStatus("Yükleme adresi alınıyor...");
            const { data: presigned } = await api.post("/storage/uploads/presigned", {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Yükleme başarısız.");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("section", { className: "max-w-2xl", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Yeni \u0130\u00E7erik Y\u00FCkle" }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsx("input", { placeholder: "Ba\u015Fl\u0131k", value: meta.title, onChange: (e) => setMeta({ ...meta, title: e.target.value }), required: true, className: "w-full px-3 py-2 border rounded" }), _jsx("textarea", { placeholder: "K\u0131sa a\u00E7\u0131klama", value: meta.description, onChange: (e) => setMeta({ ...meta, description: e.target.value }), className: "w-full px-3 py-2 border rounded" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("input", { placeholder: "Ders", value: meta.subject, onChange: (e) => setMeta({ ...meta, subject: e.target.value }), className: "px-3 py-2 border rounded" }), _jsx("input", { type: "number", min: 1, max: 12, placeholder: "S\u0131n\u0131f seviyesi", value: meta.gradeLevel, onChange: (e) => setMeta({ ...meta, gradeLevel: Number(e.target.value) }), className: "px-3 py-2 border rounded" })] }), _jsx("input", { placeholder: "Kazan\u0131m kodlar\u0131 (virg\u00FClle)", value: meta.outcomes, onChange: (e) => setMeta({ ...meta, outcomes: e.target.value }), className: "w-full px-3 py-2 border rounded" }), _jsx("input", { placeholder: "Etiketler (virg\u00FClle)", value: meta.tags, onChange: (e) => setMeta({ ...meta, tags: e.target.value }), className: "w-full px-3 py-2 border rounded" }), _jsx("input", { type: "file", accept: ".zip", onChange: (e) => setFile(e.target.files?.[0] ?? null), required: true, className: "w-full" }), status && _jsx("p", { className: "text-sm text-slate-700", children: status }), error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsx("button", { disabled: busy || !file, className: "px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-60", children: busy ? "İşleniyor..." : "Gönder" })] })] }));
}
