import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, XCircle, ArrowLeft, Clock } from "lucide-react";
import { api } from "@/lib/api";

interface ReviewHistoryItem {
  id: string;
  title: string;
  decision: "Approved" | "Rejected" | "RevisionRequested";
  comment?: string;
  decidedAtUtc: string;
}

export default function EditorHistoryPage() {
  const [items, setItems] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ReviewHistoryItem[]>("/review/history")
      .then(({ data }) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/editor" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Panele Dön
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Karar Geçmişim</h1>
          <p className="text-sm text-slate-600 mt-1">İnceleyip sonuçlandırdığınız tüm içeriklerin listesi.</p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Henüz herhangi bir içeriği incelemediniz.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{item.title}</h3>
                  {item.comment && (
                    <p className="mt-1 text-sm text-slate-600 border-l-2 border-slate-200 pl-3 italic">
                      "{item.comment}"
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.decidedAtUtc).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                    item.decision === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    item.decision === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {item.decision === "Approved" ? <CheckCircle2 className="w-4 h-4" /> :
                     item.decision === "Rejected" ? <XCircle className="w-4 h-4" /> :
                     <ClipboardCheck className="w-4 h-4" />}
                    {item.decision === "Approved" ? "Onaylandı" :
                     item.decision === "Rejected" ? "Reddedildi" : "Revizyon İstendi"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
