import { useEffect, useState } from "react";
import { TrendingUp, Users, FileText, Eye, Activity, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";

interface ReportsData {
  activeUsers: string;
  activeUsersDelta: string;
  publishedContents: string;
  publishedContentsDelta: string;
  totalPlays: string;
  totalPlaysDelta: string;
  aiApprovalRate: string;
  aiApprovalRateDelta: string;
  topTeachers: { name: string; contents: number }[];
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    api.get<ReportsData>("/admin/reports").then((res) => setData(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Raporlar & Metrikler</h1>
          <p className="text-sm text-slate-600 mt-1">Platform sağlığı, kullanım istatistikleri ve içerik metrikleri.</p>
        </div>
        <select className="text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none">
          <option>Son 7 gün</option>
          <option>Son 30 gün</option>
          <option>Son 90 gün</option>
        </select>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Users} label="Aktif kullanıcı" value={data?.activeUsers ?? "—"} delta={data?.activeUsersDelta ?? "—"} tone="brand" />
        <Kpi icon={FileText} label="Yayınlanan içerik" value={data?.publishedContents ?? "—"} delta={data?.publishedContentsDelta ?? "—"} tone="accent" />
        <Kpi icon={Eye} label="Toplam oynatma" value={data?.totalPlays ?? "—"} delta={data?.totalPlaysDelta ?? "—"} tone="emerald" />
        <Kpi icon={Activity} label="AI onay oranı" value={data?.aiApprovalRate ?? "—"} delta={data?.aiApprovalRateDelta ?? "—"} tone="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" /> İçerik üretim trendi
            </h2>
            <span className="text-xs text-slate-500">Son 30 gün</span>
          </div>
          <div className="h-64 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-100 flex items-center justify-center text-slate-500 text-sm text-center px-6">
            {data
              ? `Özet: ${data.publishedContents} yayınlanan içerik, ${data.totalPlays} oynatma, AI onay ${data.aiApprovalRate}.`
              : "Rapor verisi yükleniyor…"}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">En aktif öğretmenler</h2>
          <ul className="space-y-3 text-sm">
            {data?.topTeachers.map((t, i) => (
              <li key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="text-slate-700">{t.name}</span>
                </div>
                <span className="text-xs text-slate-500">{t.contents} içerik</span>
              </li>
            ))}
            {!data && <li className="text-sm text-slate-500">Yükleniyor...</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <strong>Not:</strong> Bu sayfa raporlama backend'ine bağlanarak gösterilmektedir. Gelecekte gerçek verilerle (Prometheus) daha detaylı hale getirilecektir.
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, delta, tone }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; delta: string;
  tone: "brand" | "accent" | "emerald" | "violet";
}) {
  const cls = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-50 text-accent-600",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  }[tone];
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg inline-flex items-center justify-center ${cls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" /> {delta}
        </span>
      </div>
      <div className="mt-3 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
