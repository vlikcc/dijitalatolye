import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
export default function EditorQueuePage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["review", "queue"],
        queryFn: async () => (await api.get("/review/queue")).data,
        refetchInterval: 5000,
    });
    if (isLoading)
        return _jsx("p", { children: "Y\u00FCkleniyor..." });
    if (error)
        return _jsx("p", { className: "text-red-600", children: error.message });
    return (_jsxs("section", { children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "\u0130nceleme Kuyru\u011Fu" }), _jsxs("div", { className: "bg-white border rounded divide-y", children: [(data ?? []).map((item) => (_jsxs(Link, { to: `/editor/review/${item.id}`, className: "flex items-center justify-between px-4 py-3 hover:bg-slate-50", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: item.title }), _jsxs("p", { className: "text-xs text-slate-500", children: ["AI: ", item.aiDecision, " \u00B7 skor ", item.aiScore, " \u00B7 \u00F6ncelik ", item.priority] })] }), _jsx("span", { className: "text-xs text-slate-400", children: new Date(item.enqueuedAtUtc).toLocaleString("tr-TR") })] }, item.id))), (data ?? []).length === 0 && _jsx("p", { className: "px-4 py-6 text-slate-500 text-sm", children: "Kuyruk bo\u015F." })] })] }));
}
