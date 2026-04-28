import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
const initialMeta = {
    title: '',
    description: '',
    subject: 'Matematik',
    gradeLevel: 4,
    outcomeCodes: [],
    tags: [],
    targetAge: undefined,
    durationMinutes: undefined,
    difficulty: 'Medium',
};
export default function TeacherUploadWizard() {
    const nav = useNavigate();
    const [step, setStep] = useState(1);
    const [meta, setMeta] = useState(initialMeta);
    const [file, setFile] = useState(null);
    const [contentId, setContentId] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    async function createContent() {
        setBusy(true);
        setError(null);
        try {
            const { data } = await api.post('/contents', meta);
            setContentId(data.id);
            setStep(2);
        }
        catch (e) {
            setError(extractError(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function uploadFile() {
        if (!file || !contentId)
            return;
        setBusy(true);
        setError(null);
        setUploadProgress(0);
        try {
            const isZip = file.name.toLowerCase().endsWith('.zip');
            const contentType = isZip ? 'application/zip' : 'text/html';
            const { data: presigned } = await api.post('/storage/uploads/presigned', {
                fileName: file.name,
                contentType,
                purpose: 'content',
            });
            const xhr = new XMLHttpRequest();
            const done = new Promise((resolve, reject) => {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable)
                        setUploadProgress(Math.round((e.loaded / e.total) * 100));
                };
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
                xhr.onerror = () => reject(new Error('Network error'));
            });
            xhr.open('PUT', presigned.url);
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.send(file);
            await done;
            await api.post(`/contents/${contentId}/versions`, {
                bucket: presigned.bucket,
                key: presigned.key,
                manifestEntry: null,
                manifestJson: null,
                fileSizeBytes: file.size,
                sha256: null,
                changeLog: 'wizard upload',
            });
            setStep(3);
        }
        catch (e) {
            setError(extractError(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function submitForReview() {
        if (!contentId)
            return;
        setBusy(true);
        try {
            await api.post(`/contents/${contentId}/submit`);
            setStep(4);
        }
        catch (e) {
            setError(extractError(e));
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "max-w-3xl mx-auto p-6", children: [_jsx("h1", { className: "text-2xl font-semibold mb-6", children: "\u0130\u00E7erik Y\u00FCkle" }), _jsx(Stepper, { current: step }), error && _jsx("div", { className: "mt-4 rounded bg-red-50 text-red-700 p-3 text-sm", children: error }), _jsxs("div", { className: "mt-6 bg-white border rounded-lg p-6", children: [step === 1 && (_jsx(MetadataStep, { meta: meta, onChange: setMeta, onNext: createContent, busy: busy })), step === 2 && (_jsx(UploadStep, { file: file, onFile: setFile, progress: uploadProgress, busy: busy, onNext: uploadFile, onBack: () => setStep(1) })), step === 3 && (_jsx(ReviewStep, { meta: meta, file: file, busy: busy, onSubmit: submitForReview, onBack: () => setStep(2) })), step === 4 && (_jsx(DoneStep, { onMine: () => nav('/teacher/contents'), onNew: () => {
                            setMeta(initialMeta);
                            setFile(null);
                            setContentId(null);
                            setUploadProgress(0);
                            setStep(1);
                        } }))] })] }));
}
function Stepper({ current }) {
    const labels = ['Bilgiler', 'Yükleme', 'Önizleme', 'Tamam'];
    return (_jsx("ol", { className: "flex items-center w-full text-sm font-medium text-gray-500", children: labels.map((l, i) => {
            const idx = (i + 1);
            const active = idx === current;
            const done = idx < current;
            return (_jsxs("li", { className: `flex items-center ${i < labels.length - 1 ? 'w-full' : ''}`, children: [_jsx("span", { className: `flex items-center justify-center w-8 h-8 rounded-full mr-2 text-xs ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`, children: idx }), _jsx("span", { className: active ? 'text-blue-600' : '', children: l }), i < labels.length - 1 && _jsx("span", { className: "flex-1 mx-3 h-px bg-gray-200" })] }, l));
        }) }));
}
function MetadataStep({ meta, onChange, onNext, busy, }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "Ba\u015Fl\u0131k", children: _jsx("input", { className: "input", value: meta.title, onChange: (e) => onChange({ ...meta, title: e.target.value }), required: true }) }), _jsx(Field, { label: "A\u00E7\u0131klama", children: _jsx("textarea", { className: "input", rows: 3, value: meta.description, onChange: (e) => onChange({ ...meta, description: e.target.value }) }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Field, { label: "Ders", children: _jsx("select", { className: "input", value: meta.subject, onChange: (e) => onChange({ ...meta, subject: e.target.value }), children: ['Matematik', 'Türkçe', 'Fen', 'Sosyal Bilgiler', 'İngilizce'].map((s) => (_jsx("option", { children: s }, s))) }) }), _jsx(Field, { label: "S\u0131n\u0131f", children: _jsx("input", { type: "number", min: 1, max: 12, className: "input", value: meta.gradeLevel, onChange: (e) => onChange({ ...meta, gradeLevel: Number(e.target.value) }) }) })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Field, { label: "Hedef ya\u015F", children: _jsx("input", { type: "number", min: 5, max: 20, className: "input", value: meta.targetAge ?? '', onChange: (e) => onChange({ ...meta, targetAge: e.target.value ? Number(e.target.value) : undefined }) }) }), _jsx(Field, { label: "S\u00FCre (dk)", children: _jsx("input", { type: "number", min: 1, max: 120, className: "input", value: meta.durationMinutes ?? '', onChange: (e) => onChange({ ...meta, durationMinutes: e.target.value ? Number(e.target.value) : undefined }) }) }), _jsx(Field, { label: "Zorluk", children: _jsxs("select", { className: "input", value: meta.difficulty ?? 'Medium', onChange: (e) => onChange({ ...meta, difficulty: e.target.value }), children: [_jsx("option", { value: "Easy", children: "Kolay" }), _jsx("option", { value: "Medium", children: "Orta" }), _jsx("option", { value: "Hard", children: "Zor" })] }) })] }), _jsx(Field, { label: "Kazan\u0131m kodlar\u0131 (virg\u00FClle)", children: _jsx("input", { className: "input", value: meta.outcomeCodes.join(','), onChange: (e) => onChange({ ...meta, outcomeCodes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }) }) }), _jsx(Field, { label: "Etiketler (virg\u00FClle)", children: _jsx("input", { className: "input", value: meta.tags.join(','), onChange: (e) => onChange({ ...meta, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }) }) }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: onNext, disabled: busy || !meta.title, className: "btn-primary", children: busy ? 'Kaydediliyor…' : 'İleri' }) })] }));
}
function UploadStep({ file, onFile, progress, busy, onNext, onBack, }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Field, { label: "ZIP veya tek HTML dosyas\u0131 (manifest.json k\u00F6k dizinde olmal\u0131)", children: _jsx("input", { type: "file", accept: ".zip,.html,.htm,application/zip,text/html", onChange: (e) => onFile(e.target.files?.[0] ?? null) }) }), _jsxs("div", { className: "text-xs text-slate-600", children: ["ZIP y\u00FCklerken k\u00F6k dizinde ", _jsx("code", { children: "manifest.json" }), " bulunmal\u0131 (", _jsx("code", { children: "entry" }), ", ", _jsx("code", { children: "title" }), ", ", _jsx("code", { children: "version" }), " alanlar\u0131 zorunlu). Maksimum 50 MB."] }), file && _jsxs("p", { className: "text-sm text-gray-600", children: [file.name, " \u2014 ", (file.size / 1024 / 1024).toFixed(2), " MB"] }), progress > 0 && (_jsx("div", { className: "w-full bg-gray-200 rounded h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded", style: { width: `${progress}%` } }) })), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: onBack, className: "btn-secondary", children: "Geri" }), _jsx("button", { onClick: onNext, disabled: busy || !file, className: "btn-primary", children: busy ? 'Yükleniyor…' : 'Yükle ve İleri' })] })] }));
}
function ReviewStep({ meta, file, busy, onSubmit, onBack, }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "\u00D6nizleme" }), _jsxs("dl", { className: "grid grid-cols-3 gap-2 text-sm", children: [_jsx(Term, { label: "Ba\u015Fl\u0131k", value: meta.title }), _jsx(Term, { label: "Ders", value: meta.subject }), _jsx(Term, { label: "S\u0131n\u0131f", value: String(meta.gradeLevel) }), _jsx(Term, { label: "Hedef ya\u015F", value: meta.targetAge ? String(meta.targetAge) : '-' }), _jsx(Term, { label: "S\u00FCre (dk)", value: meta.durationMinutes ? String(meta.durationMinutes) : '-' }), _jsx(Term, { label: "Zorluk", value: meta.difficulty ?? '-' }), _jsx(Term, { label: "Kazan\u0131mlar", value: meta.outcomeCodes.join(', ') }), _jsx(Term, { label: "Etiketler", value: meta.tags.join(', ') }), _jsx(Term, { label: "Dosya", value: file?.name ?? '-' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: onBack, className: "btn-secondary", children: "Geri" }), _jsx("button", { onClick: onSubmit, disabled: busy, className: "btn-primary", children: busy ? 'Gönderiliyor…' : 'AI Moderasyona Gönder' })] })] }));
}
function DoneStep({ onMine, onNew }) {
    return (_jsxs("div", { className: "text-center space-y-4 py-8", children: [_jsx("div", { className: "text-5xl", children: "\u2713" }), _jsx("p", { className: "text-lg", children: "\u0130\u00E7erik AI moderasyon kuyru\u011Funa g\u00F6nderildi. Sonu\u00E7 i\u00E7in bildirimleri takip edin." }), _jsxs("div", { className: "flex justify-center gap-3", children: [_jsx("button", { className: "btn-secondary", onClick: onMine, children: "\u0130\u00E7eriklerim" }), _jsx("button", { className: "btn-primary", onClick: onNew, children: "Yeni Y\u00FCkleme" })] })] }));
}
function Field({ label, children }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "block text-sm text-gray-700 mb-1", children: label }), children] }));
}
function Term({ label, value }) {
    return (_jsxs(_Fragment, { children: [_jsx("dt", { className: "text-gray-500", children: label }), _jsx("dd", { className: "col-span-2 font-medium", children: value || '-' })] }));
}
function extractError(e) {
    if (e && typeof e === 'object' && 'response' in e) {
        const r = e.response;
        return r?.data?.error ?? r?.data?.detail ?? r?.data?.title ?? 'Bilinmeyen hata';
    }
    if (e instanceof Error)
        return e.message;
    return 'Bilinmeyen hata';
}
