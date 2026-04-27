import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, XCircle, ArrowLeft, Clock } from "lucide-react";
import { api } from "@/lib/api";
export default function EditorHistoryPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get("/review/history")
            .then(({ data }) => setItems(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return _jsx("div", { className: "p-8 text-slate-500", children: "Y\u00FCkleniyor..." });
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("header", { className: "mb-6 flex items-center justify-between", children: _jsxs("div", { children: [_jsxs(Link, { to: "/editor", className: "inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 mb-2", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " Panele D\u00F6n"] }), _jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Karar Ge\u00E7mi\u015Fim" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "\u0130nceleyip sonu\u00E7land\u0131rd\u0131\u011F\u0131n\u0131z t\u00FCm i\u00E7eriklerin listesi." })] }) }), _jsx("div", { className: "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden", children: items.length === 0 ? (_jsxs("div", { className: "p-8 text-center text-slate-500", children: [_jsx(ClipboardCheck, { className: "w-12 h-12 mx-auto text-slate-300 mb-3" }), _jsx("p", { children: "Hen\u00FCz herhangi bir i\u00E7eri\u011Fi incelemediniz." })] })) : (_jsx("div", { className: "divide-y divide-slate-100", children: items.map((item) => (_jsxs("div", { className: "p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-slate-50 transition", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-slate-900 text-lg", children: item.title }), item.comment && (_jsxs("p", { className: "mt-1 text-sm text-slate-600 border-l-2 border-slate-200 pl-3 italic", children: ["\"", item.comment, "\""] })), _jsxs("p", { className: "mt-2 text-xs text-slate-500 inline-flex items-center gap-1.5", children: [_jsx(Clock, { className: "w-3.5 h-3.5" }), new Date(item.decidedAtUtc).toLocaleString("tr-TR")] })] }), _jsx("div", { className: "shrink-0", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${item.decision === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                        item.decision === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                            "bg-amber-50 text-amber-700 border-amber-200"}`, children: [item.decision === "Approved" ? _jsx(CheckCircle2, { className: "w-4 h-4" }) :
                                            item.decision === "Rejected" ? _jsx(XCircle, { className: "w-4 h-4" }) :
                                                _jsx(ClipboardCheck, { className: "w-4 h-4" }), item.decision === "Approved" ? "Onaylandı" :
                                            item.decision === "Rejected" ? "Reddedildi" : "Revizyon İstendi"] }) })] }, item.id))) })) })] }));
}
