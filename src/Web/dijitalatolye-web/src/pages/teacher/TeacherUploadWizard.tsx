import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

interface ContentMeta {
  title: string;
  description: string;
  subject: string;
  gradeLevel: number;
  outcomeCodes: string[];
  tags: string[];
}

const initialMeta: ContentMeta = {
  title: '',
  description: '',
  subject: 'Matematik',
  gradeLevel: 4,
  outcomeCodes: [],
  tags: [],
};

export default function TeacherUploadWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [meta, setMeta] = useState<ContentMeta>(initialMeta);
  const [file, setFile] = useState<File | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createContent() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post('/contents', meta);
      setContentId(data.id);
      setStep(2);
    } catch (e: unknown) {
      setError(extractError(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile() {
    if (!file || !contentId) return;
    setBusy(true);
    setError(null);
    setUploadProgress(0);
    try {
      const { data: presigned } = await api.post('/storage/uploads/presigned', {
        contentId,
        purpose: 'content',
        contentType: 'application/zip',
        sizeBytes: file.size,
      });

      const xhr = new XMLHttpRequest();
      const done = new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error'));
      });
      xhr.open('PUT', presigned.uploadUrl);
      xhr.setRequestHeader('Content-Type', 'application/zip');
      xhr.send(file);
      await done;

      await api.post(`/contents/${contentId}/versions`, {
        storageBucket: presigned.bucket,
        storageKey: presigned.objectKey,
        manifestEntry: 'index.html',
        fileSizeBytes: file.size,
        sha256: '',
        changeLog: 'wizard upload',
      });

      setStep(3);
    } catch (e: unknown) {
      setError(extractError(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitForReview() {
    if (!contentId) return;
    setBusy(true);
    try {
      await api.post(`/contents/${contentId}/submit`);
      setStep(4);
    } catch (e: unknown) {
      setError(extractError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">İçerik Yükle</h1>
      <Stepper current={step} />

      {error && <div className="mt-4 rounded bg-red-50 text-red-700 p-3 text-sm">{error}</div>}

      <div className="mt-6 bg-white border rounded-lg p-6">
        {step === 1 && (
          <MetadataStep
            meta={meta}
            onChange={setMeta}
            onNext={createContent}
            busy={busy}
          />
        )}
        {step === 2 && (
          <UploadStep
            file={file}
            onFile={setFile}
            progress={uploadProgress}
            busy={busy}
            onNext={uploadFile}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ReviewStep
            meta={meta}
            file={file}
            busy={busy}
            onSubmit={submitForReview}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <DoneStep
            onMine={() => nav('/teacher/contents')}
            onNew={() => {
              setMeta(initialMeta);
              setFile(null);
              setContentId(null);
              setUploadProgress(0);
              setStep(1);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const labels = ['Bilgiler', 'Yükleme', 'Önizleme', 'Tamam'];
  return (
    <ol className="flex items-center w-full text-sm font-medium text-gray-500">
      {labels.map((l, i) => {
        const idx = (i + 1) as Step;
        const active = idx === current;
        const done = idx < current;
        return (
          <li key={l} className={`flex items-center ${i < labels.length - 1 ? 'w-full' : ''}`}>
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 text-xs ${
                active
                  ? 'bg-blue-600 text-white'
                  : done
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {idx}
            </span>
            <span className={active ? 'text-blue-600' : ''}>{l}</span>
            {i < labels.length - 1 && <span className="flex-1 mx-3 h-px bg-gray-200" />}
          </li>
        );
      })}
    </ol>
  );
}

function MetadataStep({
  meta,
  onChange,
  onNext,
  busy,
}: {
  meta: ContentMeta;
  onChange: (m: ContentMeta) => void;
  onNext: () => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Başlık">
        <input
          className="input"
          value={meta.title}
          onChange={(e) => onChange({ ...meta, title: e.target.value })}
          required
        />
      </Field>
      <Field label="Açıklama">
        <textarea
          className="input"
          rows={3}
          value={meta.description}
          onChange={(e) => onChange({ ...meta, description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ders">
          <select
            className="input"
            value={meta.subject}
            onChange={(e) => onChange({ ...meta, subject: e.target.value })}
          >
            {['Matematik', 'Türkçe', 'Fen', 'Sosyal Bilgiler', 'İngilizce'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Sınıf">
          <input
            type="number"
            min={1}
            max={12}
            className="input"
            value={meta.gradeLevel}
            onChange={(e) => onChange({ ...meta, gradeLevel: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Kazanım kodları (virgülle)">
        <input
          className="input"
          value={meta.outcomeCodes.join(',')}
          onChange={(e) =>
            onChange({ ...meta, outcomeCodes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
          }
        />
      </Field>
      <Field label="Etiketler (virgülle)">
        <input
          className="input"
          value={meta.tags.join(',')}
          onChange={(e) =>
            onChange({ ...meta, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
          }
        />
      </Field>
      <div className="flex justify-end">
        <button onClick={onNext} disabled={busy || !meta.title} className="btn-primary">
          {busy ? 'Kaydediliyor…' : 'İleri'}
        </button>
      </div>
    </div>
  );
}

function UploadStep({
  file,
  onFile,
  progress,
  busy,
  onNext,
  onBack,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  progress: number;
  busy: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="ZIP dosyası (HTML5 oyun paketi, manifest.json + index.html içermeli)">
        <input
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </Field>
      {file && <p className="text-sm text-gray-600">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded h-2">
          <div className="bg-blue-600 h-2 rounded" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">Geri</button>
        <button onClick={onNext} disabled={busy || !file} className="btn-primary">
          {busy ? 'Yükleniyor…' : 'Yükle ve İleri'}
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  meta,
  file,
  busy,
  onSubmit,
  onBack,
}: {
  meta: ContentMeta;
  file: File | null;
  busy: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Önizleme</h2>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <Term label="Başlık" value={meta.title} />
        <Term label="Ders" value={meta.subject} />
        <Term label="Sınıf" value={String(meta.gradeLevel)} />
        <Term label="Kazanımlar" value={meta.outcomeCodes.join(', ')} />
        <Term label="Etiketler" value={meta.tags.join(', ')} />
        <Term label="Dosya" value={file?.name ?? '-'} />
      </dl>
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">Geri</button>
        <button onClick={onSubmit} disabled={busy} className="btn-primary">
          {busy ? 'Gönderiliyor…' : 'AI Moderasyona Gönder'}
        </button>
      </div>
    </div>
  );
}

function DoneStep({ onMine, onNew }: { onMine: () => void; onNew: () => void }) {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="text-5xl">✓</div>
      <p className="text-lg">İçerik AI moderasyon kuyruğuna gönderildi. Sonuç için bildirimleri takip edin.</p>
      <div className="flex justify-center gap-3">
        <button className="btn-secondary" onClick={onMine}>İçeriklerim</button>
        <button className="btn-primary" onClick={onNew}>Yeni Yükleme</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 font-medium">{value || '-'}</dd>
    </>
  );
}

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const r = (e as { response?: { data?: { detail?: string; title?: string } } }).response;
    return r?.data?.detail ?? r?.data?.title ?? 'Bilinmeyen hata';
  }
  if (e instanceof Error) return e.message;
  return 'Bilinmeyen hata';
}
