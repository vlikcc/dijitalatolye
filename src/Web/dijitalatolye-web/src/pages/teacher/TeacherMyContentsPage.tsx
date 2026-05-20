import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

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

interface ContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  updatedAt: string;
  grade?: string;
  subject?: string;
}

export default function TeacherMyContentsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-contents"],
    queryFn: async () => {
      const { data } = await api.get<ContentItem[]>("/contents/mine");
      return data;
    },
  });

  async function revise(id: string) {
    try {
      await api.post(`/contents/${id}/revise`);
      await qc.invalidateQueries({ queryKey: ["teacher-contents"] });
      nav("/teacher/contents/wizard");
    } catch {
      // Backend zaten 409 döndürüyor; UI'da sessizce yutuyoruz, en kötü liste güncel kalır.
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">İçeriklerim</h1>
          <p className="text-sm text-slate-600 mt-1">Yüklediğiniz tüm içeriklerin durumunu buradan takip edebilirsiniz.</p>
        </div>
        <Link to="/teacher/contents/wizard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20">
          <Plus className="w-4 h-4" /> Yeni içerik
        </Link>
      </header>

      {isLoading && (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <p className="mt-3 text-sm">İçerikleriniz yükleniyor…</p>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl bg-white border border-rose-200 p-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-900">İçerikler yüklenemedi</p>
            <p className="text-sm text-slate-600 mt-1">
              Bağlantınızı kontrol edip sayfayı yenileyin. Hata devam ederse destekle iletişime geçin.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && <EmptyState />}

      {!isLoading && data && data.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Başlık</th>
                <th className="px-4 py-3 font-semibold">Sınıf / Ders</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Son güncelleme</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.grade ?? "—"} {c.subject ? `• ${c.subject}` : ""}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      {(c.status === "RevisionRequested" || c.status === "AutoRejected") && (
                        <button
                          onClick={() => revise(c.id)}
                          className="inline-flex items-center gap-1 text-amber-700 font-medium hover:text-amber-800"
                          title="İçeriği Draft durumuna alıp revize et"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Revize et
                        </button>
                      )}
                      <Link to={`/teacher/contents/${c.id}`} className="text-brand-700 font-medium hover:text-brand-800">
                        Detay →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white border border-dashed border-brand-200 p-12 text-center">
      <div className="inline-flex w-12 h-12 rounded-xl bg-brand-50 text-brand-700 items-center justify-center">
        <FileText className="w-6 h-6" />
      </div>
      <h2 className="mt-4 font-semibold text-slate-900">Henüz içerik yüklemediniz</h2>
      <p className="mt-1 text-sm text-slate-600">İlk interaktif içeriğinizi 5 dakikada yayına hazırlayabilirsiniz.</p>
      <Link to="/teacher/contents/wizard"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700">
        <Plus className="w-4 h-4" /> İlk içeriği yükle
      </Link>
    </div>
  );
}

function StatusBadge({ status }: { status: ContentItem["status"] }) {
  const map: Record<ContentStatus, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    Draft: { label: "Taslak", cls: "bg-slate-100 text-slate-700", icon: FileText },
    Submitted: { label: "Gönderildi", cls: "bg-brand-50 text-brand-700", icon: Clock },
    AIReviewing: { label: "AI inceliyor", cls: "bg-violet-50 text-violet-700", icon: Loader2 },
    AIReviewed: { label: "AI tamamlandı", cls: "bg-violet-50 text-violet-700", icon: CheckCircle2 },
    EditorReviewing: { label: "Editörde", cls: "bg-amber-50 text-amber-700", icon: Clock },
    Approved: { label: "Onaylandı", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
    Published: { label: "Yayında", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
    Rejected: { label: "Reddedildi", cls: "bg-rose-50 text-rose-700", icon: XCircle },
    RevisionRequested: { label: "Revizyon istendi", cls: "bg-amber-50 text-amber-700", icon: AlertTriangle },
    AutoRejected: { label: "Otomatik reddedildi", cls: "bg-rose-50 text-rose-700", icon: XCircle },
    Unpublished: { label: "Yayından kaldırıldı", cls: "bg-slate-100 text-slate-700", icon: FileText },
  };
  const fallback = { label: String(status ?? "Bilinmiyor"), cls: "bg-slate-100 text-slate-700", icon: FileText };
  const m = map[status] ?? fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
      <m.icon className="w-3.5 h-3.5" /> {m.label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
