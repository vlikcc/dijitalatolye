import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";

type ContentStatus =
  | "Draft"
  | "Submitted"
  | "AIReviewing"
  | "AIReviewed"
  | "EditorReviewing"
  | "Approved"
  | "Rejected"
  | "RevisionRequested"
  | "AutoRejected"
  | "Published"
  | "Unpublished";

interface ContentDetail {
  id: string;
  title: string;
  description?: string | null;
  slug?: string | null;
  subject?: string;
  gradeLevel?: number | null;
  tags?: string[];
  outcomeCodes?: string[];
  state: ContentStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc?: string | null;
  currentVersionId?: string | null;
  versions?: { id: string; versionNumber: number; createdAtUtc: string }[];
}

export default function TeacherContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-content", id],
    queryFn: async () => (await api.get<ContentDetail>(`/contents/${id}`)).data,
    enabled: !!id,
  });

  async function revise() {
    if (!id) return;
    setActionError(null);
    try {
      await api.post(`/contents/${id}/revise`);
      await qc.invalidateQueries({ queryKey: ["teacher-contents"] });
      navigate("/teacher/contents/wizard");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        <p className="mt-3 text-sm">İçerik yükleniyor…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl bg-white border border-rose-200 p-8">
        <p className="font-semibold text-slate-900">İçerik bulunamadı</p>
        <p className="text-sm text-slate-600 mt-1">Bu içeriğe erişiminiz olmayabilir veya kayıt silinmiş olabilir.</p>
        <Link to="/teacher/contents" className="inline-block mt-4 text-sm font-medium text-brand-700 hover:text-brand-800">
          ← İçeriklerime dön
        </Link>
      </div>
    );
  }

  const versionCount = data.versions?.length ?? 0;

  return (
    <div className="max-w-3xl">
      <Link
        to="/teacher/contents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> İçeriklerime dön
      </Link>

      <header className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">İçerik detayı</p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{data.title}</h1>
            <p className="text-sm text-slate-600 mt-2">
              {data.subject || "—"}
              {data.gradeLevel ? ` · ${data.gradeLevel}. sınıf` : ""}
            </p>
          </div>
          <StatusPill status={data.state} />
        </div>

        {data.description && (
          <p className="mt-4 text-slate-700 leading-relaxed">{data.description}</p>
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <span key={t} className="text-xs bg-brand-50 text-brand-800 rounded-full px-2.5 py-1 font-medium">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <section className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-700 space-y-3">
        <Row label="Durum" value={statusLabel(data.state)} />
        <Row label="Versiyon sayısı" value={String(versionCount)} />
        <Row label="Oluşturulma" value={formatDate(data.createdAtUtc)} />
        <Row label="Son güncelleme" value={formatDate(data.updatedAtUtc)} />
        {data.publishedAtUtc && <Row label="Yayınlanma" value={formatDate(data.publishedAtUtc)} />}
        {!data.currentVersionId && data.state === "Draft" && (
          <p className="text-amber-700 text-xs pt-1">
            Henüz dosya yüklenmemiş. Yükleme sihirbazından devam edebilirsiniz.
          </p>
        )}
      </section>

      {actionError && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {actionError}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {(data.state === "RevisionRequested" || data.state === "AutoRejected") && (
          <button
            type="button"
            onClick={revise}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
          >
            <RefreshCw className="w-4 h-4" /> Revize et
          </button>
        )}
        {data.state === "AutoRejected" && (
          <p className="w-full text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            AI moderasyon bu içeriği otomatik reddetti. Oyunlarda skor kaydı için kullanılan{" "}
            <code className="text-xs bg-rose-100 px-1 rounded">localStorage</code> artık doğrudan red nedeni değil;
            yine de içeriği kazanıma uygun hale getirip yeniden gönderin.
          </p>
        )}
        {(data.state === "Draft" || data.state === "RevisionRequested" || data.state === "AutoRejected") && (
          <Link
            to="/teacher/contents/wizard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 text-brand-800 font-semibold hover:bg-brand-50"
          >
            Yükleme sihirbazı
          </Link>
        )}
        {data.slug && (
          <Link
            to={`/contents/${data.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
          >
            <ExternalLink className="w-4 h-4" /> Herkese açık sayfa
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: ContentStatus }) {
  const cls =
    status === "Published" || status === "Approved"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "Rejected" || status === "AutoRejected"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : status === "RevisionRequested"
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {statusLabel(status)}
    </span>
  );
}

function statusLabel(status: ContentStatus): string {
  const map: Record<ContentStatus, string> = {
    Draft: "Taslak",
    Submitted: "Gönderildi",
    AIReviewing: "AI inceliyor",
    AIReviewed: "AI tamamlandı",
    EditorReviewing: "Editörde",
    Approved: "Onaylandı",
    Published: "Yayında",
    Rejected: "Reddedildi",
    RevisionRequested: "Revizyon istendi",
    AutoRejected: "Otomatik reddedildi",
    Unpublished: "Yayından kaldırıldı",
  };
  return map[status] ?? status;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
