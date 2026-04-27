import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, FileText, CheckCircle, Clock, PlusCircle, PlayCircle } from "lucide-react";
import { api } from "@/lib/api";
export default function TeacherDashboardPage() {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get("/contents/mine")
            .then(({ data }) => setContents(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return _jsx("div", { className: "p-8 text-slate-500", children: "Y\u00FCkleniyor..." });
    }
    const published = contents.filter(c => c.state === "Published" || c.state === "Approved");
    const pending = contents.filter(c => ["Submitted", "AIReviewing", "AIReviewed", "EditorReviewing"].includes(c.state));
    const drafts = contents.filter(c => c.state === "Draft" || c.state === "RevisionRequested");
    return (_jsxs("div", { className: "max-w-6xl", children: [_jsxs("header", { className: "mb-8 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Kontrol Paneli" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "\u0130\u00E7eriklerinize ait g\u00FCncel durum \u00F6zeti." })] }), _jsxs(Link, { to: "/teacher/contents/wizard", className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20", children: [_jsx(PlusCircle, { className: "w-5 h-5" }), "Yeni \u0130\u00E7erik Y\u00FCkle"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx(StatCard, { title: "Yay\u0131nda", value: published.length, icon: CheckCircle, color: "emerald" }), _jsx(StatCard, { title: "\u0130ncelemede", value: pending.length, icon: Clock, color: "amber" }), _jsx(StatCard, { title: "Taslak / Revizyon", value: drafts.length, icon: FileText, color: "slate" })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", children: [_jsxs("div", { className: "px-6 py-5 border-b border-slate-200 flex items-center justify-between", children: [_jsxs("h2", { className: "font-semibold text-slate-900 inline-flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-brand-600" }), "Son Y\u00FCklenenler"] }), _jsx(Link, { to: "/teacher/contents", className: "text-sm font-medium text-brand-600 hover:text-brand-700", children: "T\u00FCm\u00FCn\u00FC G\u00F6r \u2192" })] }), _jsx("div", { className: "divide-y divide-slate-100", children: contents.length === 0 ? (_jsx("div", { className: "p-8 text-center text-slate-500", children: _jsx("p", { children: "Hen\u00FCz hi\u00E7 i\u00E7erik y\u00FCklemediniz." }) })) : (contents.slice(0, 5).map((c) => (_jsxs("div", { className: "px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-slate-900", children: c.title }), _jsxs("div", { className: "text-xs text-slate-500 mt-1 flex gap-2", children: [_jsx("span", { children: c.subject }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [c.gradeLevel, ". S\u0131n\u0131f"] })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: `px-2.5 py-1 rounded-full text-xs font-medium ${["Published", "Approved"].includes(c.state) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                                ["Draft", "RevisionRequested"].includes(c.state) ? "bg-slate-100 text-slate-700 border border-slate-200" :
                                                    "bg-amber-50 text-amber-700 border border-amber-200"}`, children: c.state }), ["Published", "Approved"].includes(c.state) && (_jsx(Link, { to: `/play/${c.id}`, className: "text-slate-400 hover:text-brand-600 transition", children: _jsx(PlayCircle, { className: "w-6 h-6" }) }))] })] }, c.id)))) })] })] }));
}
function StatCard({ title, value, icon: Icon, color }) {
    const colorStyles = {
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        slate: "bg-slate-50 text-slate-600"
    };
    return (_jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm", children: [_jsx("div", { className: `w-14 h-14 rounded-xl flex items-center justify-center ${colorStyles[color]}`, children: _jsx(Icon, { className: "w-7 h-7" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: title }), _jsx("p", { className: "text-3xl font-extrabold text-slate-900 mt-1", children: value })] })] }));
}
