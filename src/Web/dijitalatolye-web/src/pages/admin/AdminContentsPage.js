import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
export default function AdminContentsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api
            .get("/contents/all", { params: { pageSize: 50 } })
            .then(({ data }) => setItems(data.items ?? []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);
    const stateBadge = {
        Draft: "bg-slate-100 text-slate-700",
        Submitted: "bg-amber-100 text-amber-700",
        InReview: "bg-blue-100 text-blue-700",
        Published: "bg-emerald-100 text-emerald-700",
        Rejected: "bg-red-100 text-red-700",
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\u0130\u00E7erik Y\u00F6netimi" }), _jsx(Link, { to: "/admin", className: "text-sm text-brand-600 hover:underline", children: "\u2190 Panele d\u00F6n" })] }), loading ? (_jsx("p", { className: "text-slate-500", children: "Y\u00FCkleniyor\u2026" })) : items.length === 0 ? (_jsx("p", { className: "text-slate-500", children: "Hen\u00FCz i\u00E7erik bulunmuyor." })) : (_jsx("div", { className: "bg-white border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50 text-left", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Ba\u015Fl\u0131k" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Durum" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Yazar" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Olu\u015Fturulma" })] }) }), _jsx("tbody", { className: "divide-y", children: items.map((item) => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "px-4 py-3 font-medium", children: item.title }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${stateBadge[item.state] ?? "bg-slate-100"}`, children: item.state }) }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: item.authorEmail ?? "—" }), _jsx("td", { className: "px-4 py-3 text-slate-500", children: new Date(item.createdAtUtc).toLocaleDateString("tr-TR") })] }, item.id))) })] }) }))] }));
}
