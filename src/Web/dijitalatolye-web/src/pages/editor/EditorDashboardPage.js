import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
export default function EditorDashboardPage() {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        api.get("/review/dashboard")
            .then(({ data }) => setStats(data))
            .catch(console.error);
    }, []);
    return (_jsxs("div", { children: [_jsxs("header", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Edit\u00F6r Paneli" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "\u0130nceleme bekleyen i\u00E7erikler ve ki\u015Fisel performans\u0131n\u0131z." })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [_jsx(Stat, { icon: Clock, label: "Beklemede", value: stats?.pendingQueue.toString() ?? "—", tone: "brand" }), _jsx(Stat, { icon: ClipboardCheck, label: "Bug\u00FCn incelenen", value: stats?.reviewedToday.toString() ?? "—", tone: "accent" }), _jsx(Stat, { icon: CheckCircle2, label: "Onaylanan (hafta)", value: stats?.approvedThisWeek.toString() ?? "—", tone: "emerald" }), _jsx(Stat, { icon: XCircle, label: "Reddedilen (hafta)", value: stats?.rejectedThisWeek.toString() ?? "—", tone: "rose" })] }), _jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white p-8 shadow-lg shadow-brand-900/20", children: [_jsx("h2", { className: "text-xl font-bold", children: "\u0130nceleme kuyru\u011Funa git" }), _jsx("p", { className: "mt-2 text-white/90", children: "AI taraf\u0131ndan \u00F6n incelemesi tamamlanan i\u00E7erikleri g\u00F6r\u00FCp karar verin." }), _jsxs(Link, { to: "/editor/queue", className: "mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50", children: ["Kuyru\u011Fu a\u00E7 ", _jsx(ArrowRight, { className: "w-4 h-4" })] })] }), _jsxs("div", { className: "mt-8 grid md:grid-cols-2 gap-5", children: [_jsxs(Link, { to: "/editor/history", className: "group rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-3 group-hover:bg-brand-600 group-hover:text-white transition", children: _jsx(ClipboardCheck, { className: "w-5 h-5" }) }), _jsx("h3", { className: "font-semibold text-slate-900", children: "Karar ge\u00E7mi\u015Fim" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Verdi\u011Finiz t\u00FCm kararlar, gerek\u00E7eler ve yeniden inceleme talepleri." })] }), _jsxs("a", { href: "https://github.com/anthropics/claude-code/issues", target: "_blank", rel: "noreferrer", className: "group rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-accent-50 text-accent-600 inline-flex items-center justify-center mb-3", children: _jsx(CheckCircle2, { className: "w-5 h-5" }) }), _jsx("h3", { className: "font-semibold text-slate-900", children: "Edit\u00F6r rehberi" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Karar verirken dikkat edilecekler, AI raporu okuma k\u0131lavuzu." })] })] })] }));
}
function Stat({ icon: Icon, label, value, tone }) {
    const cls = {
        brand: "bg-brand-50 text-brand-700",
        accent: "bg-accent-50 text-accent-600",
        emerald: "bg-emerald-50 text-emerald-700",
        rose: "bg-rose-50 text-rose-700",
    }[tone];
    return (_jsxs("div", { className: "rounded-2xl bg-white border border-slate-200 p-5", children: [_jsx("div", { className: `w-10 h-10 rounded-lg inline-flex items-center justify-center ${cls}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsx("div", { className: "mt-3 text-2xl font-extrabold text-slate-900", children: value }), _jsx("div", { className: "text-xs text-slate-500", children: label })] }));
}
