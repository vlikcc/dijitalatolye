import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
export default function AdminCatalogPage() {
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([
            api.get("/catalog/grades").then(({ data }) => setGrades(data)),
            api.get("/catalog/subjects").then(({ data }) => setSubjects(data)),
        ])
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "M\u00FCfredat / Kazan\u0131m" }), _jsx(Link, { to: "/admin", className: "text-sm text-brand-600 hover:underline", children: "\u2190 Panele d\u00F6n" })] }), loading ? (_jsx("p", { className: "text-slate-500", children: "Y\u00FCkleniyor\u2026" })) : (_jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("section", { className: "bg-white border rounded-lg p-5", children: [_jsxs("h2", { className: "font-semibold mb-3", children: ["S\u0131n\u0131flar (", grades.length, ")"] }), grades.length === 0 ? (_jsx("p", { className: "text-slate-500 text-sm", children: "S\u0131n\u0131f verisi bulunamad\u0131." })) : (_jsx("ul", { className: "space-y-1 text-sm", children: grades.map((g) => (_jsxs("li", { className: "flex justify-between py-1.5 border-b last:border-0", children: [_jsx("span", { className: "font-medium", children: g.name }), _jsx("span", { className: "text-slate-500", children: g.code })] }, g.id))) }))] }), _jsxs("section", { className: "bg-white border rounded-lg p-5", children: [_jsxs("h2", { className: "font-semibold mb-3", children: ["Dersler (", subjects.length, ")"] }), subjects.length === 0 ? (_jsx("p", { className: "text-slate-500 text-sm", children: "Ders verisi bulunamad\u0131." })) : (_jsx("ul", { className: "space-y-1 text-sm", children: subjects.map((s) => (_jsxs("li", { className: "flex justify-between py-1.5 border-b last:border-0", children: [_jsx("span", { className: "font-medium", children: s.name }), _jsx("span", { className: "text-slate-500", children: s.code })] }, s.id))) }))] })] }))] }));
}
