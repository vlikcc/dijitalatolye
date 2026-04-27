import { Link } from "react-router-dom";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface DashboardStats {
  pendingQueue: number;
  reviewedToday: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
}

export default function EditorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/review/dashboard")
      .then(({ data }) => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Editör Paneli</h1>
        <p className="text-sm text-slate-600 mt-1">İnceleme bekleyen içerikler ve kişisel performansınız.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Clock} label="Beklemede" value={stats?.pendingQueue.toString() ?? "—"} tone="brand" />
        <Stat icon={ClipboardCheck} label="Bugün incelenen" value={stats?.reviewedToday.toString() ?? "—"} tone="accent" />
        <Stat icon={CheckCircle2} label="Onaylanan (hafta)" value={stats?.approvedThisWeek.toString() ?? "—"} tone="emerald" />
        <Stat icon={XCircle} label="Reddedilen (hafta)" value={stats?.rejectedThisWeek.toString() ?? "—"} tone="rose" />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white p-8 shadow-lg shadow-brand-900/20">
        <h2 className="text-xl font-bold">İnceleme kuyruğuna git</h2>
        <p className="mt-2 text-white/90">AI tarafından ön incelemesi tamamlanan içerikleri görüp karar verin.</p>
        <Link to="/editor/queue"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50">
          Kuyruğu aç <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-5">
        <Link to="/editor/history"
          className="group rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-3 group-hover:bg-brand-600 group-hover:text-white transition">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900">Karar geçmişim</h3>
          <p className="mt-1 text-sm text-slate-600">Verdiğiniz tüm kararlar, gerekçeler ve yeniden inceleme talepleri.</p>
        </Link>

        <a href="https://github.com/anthropics/claude-code/issues" target="_blank" rel="noreferrer"
          className="group rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 inline-flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900">Editör rehberi</h3>
          <p className="mt-1 text-sm text-slate-600">Karar verirken dikkat edilecekler, AI raporu okuma kılavuzu.</p>
        </a>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string;
  tone: "brand" | "accent" | "emerald" | "rose";
}) {
  const cls = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-50 text-accent-600",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }[tone];
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg inline-flex items-center justify-center ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
