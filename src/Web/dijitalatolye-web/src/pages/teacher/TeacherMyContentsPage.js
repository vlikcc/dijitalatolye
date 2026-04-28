import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
export default function TeacherMyContentsPage() {
    const nav = useNavigate();
    const qc = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["teacher-contents"],
        queryFn: async () => {
            const { data } = await api.get("/contents/mine");
            return data;
        },
    });
    async function revise(id) {
        try {
            await api.post(`/contents/${id}/revise`);
            await qc.invalidateQueries({ queryKey: ["teacher-contents"] });
            nav("/teacher/contents/wizard");
        }
        catch {
            // Backend zaten 409 döndürüyor; UI'da sessizce yutuyoruz, en kötü liste güncel kalır.
        }
    }
    return (_jsxs("div", { children: [_jsxs("header", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "\u0130\u00E7eriklerim" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "Y\u00FCkledi\u011Finiz t\u00FCm i\u00E7eriklerin durumunu buradan takip edebilirsiniz." })] }), _jsxs(Link, { to: "/teacher/contents/wizard", className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20", children: [_jsx(Plus, { className: "w-4 h-4" }), " Yeni i\u00E7erik"] })] }), isLoading && (_jsxs("div", { className: "rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center text-slate-500", children: [_jsx(Loader2, { className: "w-6 h-6 animate-spin text-brand-600" }), _jsx("p", { className: "mt-3 text-sm", children: "\u0130\u00E7erikleriniz y\u00FCkleniyor\u2026" })] })), isError && (_jsxs("div", { className: "rounded-2xl bg-white border border-rose-200 p-8 flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-rose-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900", children: "\u0130\u00E7erikler y\u00FCklenemedi" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "Ba\u011Flant\u0131n\u0131z\u0131 kontrol edip sayfay\u0131 yenileyin. Hata devam ederse destekle ileti\u015Fime ge\u00E7in." })] })] })), !isLoading && !isError && (data?.length ?? 0) === 0 && _jsx(EmptyState, {}), !isLoading && data && data.length > 0 && (_jsx("div", { className: "rounded-2xl bg-white border border-slate-200 overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600 text-left", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-semibold", children: "Ba\u015Fl\u0131k" }), _jsx("th", { className: "px-4 py-3 font-semibold", children: "S\u0131n\u0131f / Ders" }), _jsx("th", { className: "px-4 py-3 font-semibold", children: "Durum" }), _jsx("th", { className: "px-4 py-3 font-semibold", children: "Son g\u00FCncelleme" }), _jsx("th", { className: "px-4 py-3" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: data.map((c) => (_jsxs("tr", { className: "hover:bg-brand-50/40", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-900", children: c.title }), _jsxs("td", { className: "px-4 py-3 text-slate-600", children: [c.grade ?? "—", " ", c.subject ? `• ${c.subject}` : ""] }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusBadge, { status: c.status }) }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: formatDate(c.updatedAt) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs("div", { className: "inline-flex items-center gap-3", children: [c.status === "RevisionRequested" && (_jsxs("button", { onClick: () => revise(c.id), className: "inline-flex items-center gap-1 text-amber-700 font-medium hover:text-amber-800", title: "\u0130\u00E7eri\u011Fi Draft durumuna al\u0131p revize et", children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), " Revize et"] })), _jsx(Link, { to: `/contents/${c.id}`, className: "text-brand-700 font-medium hover:text-brand-800", children: "Detay \u2192" })] }) })] }, c.id))) })] }) }))] }));
}
function EmptyState() {
    return (_jsxs("div", { className: "rounded-2xl bg-white border border-dashed border-brand-200 p-12 text-center", children: [_jsx("div", { className: "inline-flex w-12 h-12 rounded-xl bg-brand-50 text-brand-700 items-center justify-center", children: _jsx(FileText, { className: "w-6 h-6" }) }), _jsx("h2", { className: "mt-4 font-semibold text-slate-900", children: "Hen\u00FCz i\u00E7erik y\u00FCklemediniz" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "\u0130lk interaktif i\u00E7eri\u011Finizi 5 dakikada yay\u0131na haz\u0131rlayabilirsiniz." }), _jsxs(Link, { to: "/teacher/contents/wizard", className: "mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700", children: [_jsx(Plus, { className: "w-4 h-4" }), " \u0130lk i\u00E7eri\u011Fi y\u00FCkle"] })] }));
}
function StatusBadge({ status }) {
    const map = {
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
    return (_jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`, children: [_jsx(m.icon, { className: "w-3.5 h-3.5" }), " ", m.label] }));
}
function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
    }
    catch {
        return iso;
    }
}
