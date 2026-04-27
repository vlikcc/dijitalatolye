import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, FileText, CheckCircle, Clock, PlusCircle, PlayCircle } from "lucide-react";
import { api } from "@/lib/api";

interface ContentItem {
  id: string;
  title: string;
  state: "Draft" | "Submitted" | "AIReviewing" | "AIReviewed" | "EditorReviewing" | "Approved" | "Published" | "Rejected" | "RevisionRequested";
  subject: string;
  gradeLevel: number;
  updatedAtUtc: string;
}

export default function TeacherDashboardPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ContentItem[]>("/contents/mine")
      .then(({ data }) => setContents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Yükleniyor...</div>;
  }

  const published = contents.filter(c => c.state === "Published" || c.state === "Approved");
  const pending = contents.filter(c => ["Submitted", "AIReviewing", "AIReviewed", "EditorReviewing"].includes(c.state));
  const drafts = contents.filter(c => c.state === "Draft" || c.state === "RevisionRequested");

  return (
    <div className="max-w-6xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Kontrol Paneli</h1>
          <p className="text-sm text-slate-600 mt-1">İçeriklerinize ait güncel durum özeti.</p>
        </div>
        <Link
          to="/teacher/contents/wizard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20"
        >
          <PlusCircle className="w-5 h-5" />
          Yeni İçerik Yükle
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Yayında" value={published.length} icon={CheckCircle} color="emerald" />
        <StatCard title="İncelemede" value={pending.length} icon={Clock} color="amber" />
        <StatCard title="Taslak / Revizyon" value={drafts.length} icon={FileText} color="slate" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 inline-flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            Son Yüklenenler
          </h2>
          <Link to="/teacher/contents" className="text-sm font-medium text-brand-600 hover:text-brand-700">Tümünü Gör →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {contents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>Henüz hiç içerik yüklemediniz.</p>
            </div>
          ) : (
            contents.slice(0, 5).map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.title}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex gap-2">
                    <span>{c.subject}</span>
                    <span>•</span>
                    <span>{c.gradeLevel}. Sınıf</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    ["Published", "Approved"].includes(c.state) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    ["Draft", "RevisionRequested"].includes(c.state) ? "bg-slate-100 text-slate-700 border border-slate-200" :
                    "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {c.state}
                  </span>
                  {["Published", "Approved"].includes(c.state) && (
                    <Link to={`/play/${c.id}`} className="text-slate-400 hover:text-brand-600 transition">
                      <PlayCircle className="w-6 h-6" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: "emerald" | "amber" | "slate" }) {
  const colorStyles = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600"
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}