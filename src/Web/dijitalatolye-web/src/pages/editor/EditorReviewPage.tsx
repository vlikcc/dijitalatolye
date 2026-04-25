import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

interface ReviewItem {
  id: string; contentId: string; versionId: string; title: string;
  aiScore: number; aiDecision: string; aiReportId: string;
}

interface ModerationReport {
  id: string; score: number; decision: string;
  criticalFlags: string[]; warnings: string[]; externalUrls: string[];
  suggestedCsp: string; llmRawJson: string;
}

export default function EditorReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: item } = useQuery({
    queryKey: ["review", "item", id],
    queryFn: async () => (await api.get<ReviewItem>(`/review/${id}`)).data,
    enabled: !!id,
  });

  const { data: report } = useQuery({
    queryKey: ["report", item?.aiReportId],
    queryFn: async () => (await api.get<ModerationReport>(`/moderation/reports/${item!.aiReportId}`)).data,
    enabled: !!item?.aiReportId,
  });

  const { data: download } = useQuery({
    queryKey: ["content", item?.contentId],
    queryFn: async () => (await api.get<{ url: string }>(`/storage/download-url`, {
      params: { bucket: "dijitalatolye-content", key: item!.versionId }
    })).data,
    enabled: false,
  });

  const decide = useMutation({
    mutationFn: async (decision: "Approved" | "Rejected" | "RevisionRequested") => {
      await api.post(`/review/${id}/decision`, { decision, comment });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review", "queue"] });
      navigate("/editor/queue");
    },
  });

  if (!item) return <p>Yükleniyor...</p>;

  return (
    <section className="grid lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-xl font-bold mb-4">{item.title}</h1>
        <div className="bg-white border rounded p-4 mb-4">
          <h2 className="font-semibold mb-2">AI Raporu</h2>
          {report ? (
            <div className="space-y-2 text-sm">
              <p><b>Skor:</b> {report.score} · <b>Karar:</b> {report.decision}</p>
              {report.criticalFlags.length > 0 && (
                <div>
                  <p className="font-semibold text-red-700">Kritik Bulgular</p>
                  <ul className="list-disc list-inside text-red-700">
                    {report.criticalFlags.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
              {report.warnings.length > 0 && (
                <div>
                  <p className="font-semibold text-amber-700">Uyarılar</p>
                  <ul className="list-disc list-inside text-amber-700">
                    {report.warnings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
              <details className="text-xs"><summary>LLM Ham JSON</summary><pre className="overflow-x-auto bg-slate-100 p-2 mt-1">{report.llmRawJson}</pre></details>
            </div>
          ) : <p className="text-sm text-slate-500">Rapor yükleniyor...</p>}
        </div>

        <textarea placeholder="Editör yorumu (opsiyonel)" value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3" />
        <div className="flex gap-2">
          <button disabled={decide.isPending}
            onClick={() => decide.mutate("Approved")}
            className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Onayla</button>
          <button disabled={decide.isPending}
            onClick={() => decide.mutate("RevisionRequested")}
            className="px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">Revizyon İste</button>
          <button disabled={decide.isPending}
            onClick={() => decide.mutate("Rejected")}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reddet</button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Önizleme (sandbox)</h2>
        {download?.url ? (
          <iframe
            src={download.url}
            sandbox="allow-scripts"
            className="w-full h-[480px] border rounded bg-white"
            title="content-preview"
          />
        ) : (
          <p className="text-sm text-slate-500">Önizleme V1 sonunda — download URL ile sandboxed iframe içinde gösterilir.</p>
        )}
      </div>
    </section>
  );
}
