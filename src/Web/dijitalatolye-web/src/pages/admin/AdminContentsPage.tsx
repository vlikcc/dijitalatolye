import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

interface ContentItem {
  id: string;
  title: string;
  state: string;
  authorEmail?: string;
  createdAtUtc: string;
}

export default function AdminContentsPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: ContentItem[] }>("/contents/all", { params: { pageSize: 50 } })
      .then(({ data }) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const stateBadge: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-700",
    Submitted: "bg-amber-100 text-amber-700",
    InReview: "bg-blue-100 text-blue-700",
    Published: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">İçerik Yönetimi</h1>
        <Link to="/admin" className="text-sm text-brand-600 hover:underline">← Panele dön</Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">Henüz içerik bulunmuyor.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Başlık</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Yazar</th>
                <th className="px-4 py-3 font-medium">Oluşturulma</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${stateBadge[item.state] ?? "bg-slate-100"}`}>
                      {item.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.authorEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(item.createdAtUtc).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
