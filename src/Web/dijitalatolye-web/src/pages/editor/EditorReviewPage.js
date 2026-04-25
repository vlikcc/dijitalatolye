import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
export default function EditorReviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [comment, setComment] = useState("");
    const { data: item } = useQuery({
        queryKey: ["review", "item", id],
        queryFn: async () => (await api.get(`/review/${id}`)).data,
        enabled: !!id,
    });
    const { data: report } = useQuery({
        queryKey: ["report", item?.aiReportId],
        queryFn: async () => (await api.get(`/moderation/reports/${item.aiReportId}`)).data,
        enabled: !!item?.aiReportId,
    });
    const { data: download } = useQuery({
        queryKey: ["content", item?.contentId],
        queryFn: async () => (await api.get(`/storage/download-url`, {
            params: { bucket: "dijitalatolye-content", key: item.versionId }
        })).data,
        enabled: false,
    });
    const decide = useMutation({
        mutationFn: async (decision) => {
            await api.post(`/review/${id}/decision`, { decision, comment });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["review", "queue"] });
            navigate("/editor/queue");
        },
    });
    if (!item)
        return _jsx("p", { children: "Y\u00FCkleniyor..." });
    return (_jsxs("section", { className: "grid lg:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold mb-4", children: item.title }), _jsxs("div", { className: "bg-white border rounded p-4 mb-4", children: [_jsx("h2", { className: "font-semibold mb-2", children: "AI Raporu" }), report ? (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { children: [_jsx("b", { children: "Skor:" }), " ", report.score, " \u00B7 ", _jsx("b", { children: "Karar:" }), " ", report.decision] }), report.criticalFlags.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-red-700", children: "Kritik Bulgular" }), _jsx("ul", { className: "list-disc list-inside text-red-700", children: report.criticalFlags.map((f, i) => _jsx("li", { children: f }, i)) })] })), report.warnings.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-amber-700", children: "Uyar\u0131lar" }), _jsx("ul", { className: "list-disc list-inside text-amber-700", children: report.warnings.map((f, i) => _jsx("li", { children: f }, i)) })] })), _jsxs("details", { className: "text-xs", children: [_jsx("summary", { children: "LLM Ham JSON" }), _jsx("pre", { className: "overflow-x-auto bg-slate-100 p-2 mt-1", children: report.llmRawJson })] })] })) : _jsx("p", { className: "text-sm text-slate-500", children: "Rapor y\u00FCkleniyor..." })] }), _jsx("textarea", { placeholder: "Edit\u00F6r yorumu (opsiyonel)", value: comment, onChange: (e) => setComment(e.target.value), className: "w-full px-3 py-2 border rounded mb-3" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { disabled: decide.isPending, onClick: () => decide.mutate("Approved"), className: "px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700", children: "Onayla" }), _jsx("button", { disabled: decide.isPending, onClick: () => decide.mutate("RevisionRequested"), className: "px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600", children: "Revizyon \u0130ste" }), _jsx("button", { disabled: decide.isPending, onClick: () => decide.mutate("Rejected"), className: "px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700", children: "Reddet" })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "font-semibold mb-2", children: "\u00D6nizleme (sandbox)" }), download?.url ? (_jsx("iframe", { src: download.url, sandbox: "allow-scripts", className: "w-full h-[480px] border rounded bg-white", title: "content-preview" })) : (_jsx("p", { className: "text-sm text-slate-500", children: "\u00D6nizleme V1 sonunda \u2014 download URL ile sandboxed iframe i\u00E7inde g\u00F6sterilir." }))] })] }));
}
