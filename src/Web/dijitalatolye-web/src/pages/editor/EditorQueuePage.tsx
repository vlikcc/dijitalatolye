import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

interface QueueItem {
  id: string; contentId: string; versionId: string; title: string;
  aiScore: number; aiDecision: string; status: string; priority: number; enqueuedAtUtc: string;
}

export default function EditorQueuePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["review", "queue"],
    queryFn: async () => (await api.get<QueueItem[]>("/review/queue")).data,
    refetchInterval: 5000,
  });

  if (isLoading) return <p>Yükleniyor...</p>;
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">İnceleme Kuyruğu</h1>
      <div className="bg-white border rounded divide-y">
        {(data ?? []).map((item) => (
          <Link key={item.id} to={`/editor/review/${item.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-slate-500">
                AI: {item.aiDecision} · skor {item.aiScore} · öncelik {item.priority}
              </p>
            </div>
            <span className="text-xs text-slate-400">{new Date(item.enqueuedAtUtc).toLocaleString("tr-TR")}</span>
          </Link>
        ))}
        {(data ?? []).length === 0 && <p className="px-4 py-6 text-slate-500 text-sm">Kuyruk boş.</p>}
      </div>
    </section>
  );
}
