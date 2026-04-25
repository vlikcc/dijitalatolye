import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
export default function DiscoverPage() {
    const [params, setParams] = useSearchParams();
    const q = params.get('q') ?? '';
    const subject = params.get('subject') ?? '';
    const grade = params.get('grade') ?? '';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    useEffect(() => {
        setLoading(true);
        api
            .get('/search/contents', {
            params: {
                q: q || undefined,
                subject: subject || undefined,
                gradeLevel: grade || undefined,
                page: 1,
                pageSize: 24,
            },
        })
            .then(({ data }) => {
            setItems(data.items ?? []);
            setTotal(data.total ?? 0);
        })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [q, subject, grade]);
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "\u0130\u00E7erik Ke\u015Ffi" }), _jsxs("div", { className: "bg-white p-4 border rounded-lg flex flex-wrap gap-3", children: [_jsx("input", { className: "input flex-1 min-w-[240px]", placeholder: "Ba\u015Fl\u0131k, etiket veya a\u00E7\u0131klama ara\u2026", defaultValue: q, onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                const v = e.target.value;
                                setParams((p) => {
                                    if (v)
                                        p.set('q', v);
                                    else
                                        p.delete('q');
                                    return p;
                                });
                            }
                        } }), _jsxs("select", { className: "input w-48", value: subject, onChange: (e) => setParams((p) => {
                            if (e.target.value)
                                p.set('subject', e.target.value);
                            else
                                p.delete('subject');
                            return p;
                        }), children: [_jsx("option", { value: "", children: "T\u00FCm Dersler" }), ['Matematik', 'Türkçe', 'Fen', 'Sosyal Bilgiler', 'İngilizce'].map((s) => (_jsx("option", { children: s }, s)))] }), _jsxs("select", { className: "input w-32", value: grade, onChange: (e) => setParams((p) => {
                            if (e.target.value)
                                p.set('grade', e.target.value);
                            else
                                p.delete('grade');
                            return p;
                        }), children: [_jsx("option", { value: "", children: "T\u00FCm S\u0131n\u0131flar" }), Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (_jsx("option", { value: g, children: `${g}. Sınıf` }, g)))] })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-3", children: [total, " sonu\u00E7"] }), loading ? (_jsx("p", { className: "mt-6", children: "Y\u00FCkleniyor\u2026" })) : (_jsx("div", { className: "mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: items.map((it) => (_jsxs(Link, { to: `/contents/${it.slug}`, className: "border rounded-lg p-4 hover:shadow transition bg-white", children: [_jsxs("div", { className: "text-xs text-gray-500 mb-1", children: [it.subject, " ", it.gradeLevel ? `· ${it.gradeLevel}. sınıf` : ''] }), _jsx("h3", { className: "font-semibold text-lg", children: it.title }), it.description && (_jsx("p", { className: "text-sm text-gray-600 mt-2 line-clamp-3", children: it.description })), _jsx("div", { className: "flex flex-wrap gap-1 mt-3", children: it.tags?.slice(0, 4).map((t) => (_jsx("span", { className: "text-xs bg-gray-100 rounded px-2 py-0.5", children: t }, t))) }), _jsxs("div", { className: "text-xs text-gray-500 mt-3 flex gap-3", children: [_jsxs("span", { children: ["\uD83D\uDC41 ", it.views ?? 0] }), _jsxs("span", { children: ["\u2665 ", it.likes ?? 0] })] })] }, it.id))) }))] }));
}
