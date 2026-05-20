import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
function useSearchParamsState() {
    const [params, setParams] = useSearchParams();
    return {
        q: params.get('q') ?? '',
        subject: params.get('subject') ?? '',
        grade: params.get('grade') ?? '',
        tag: params.get('tag') ?? '',
        setParams,
    };
}
export default function DiscoverPage() {
    const { q, subject, grade, tag, setParams } = useSearchParamsState();
    const [carouselIndex, setCarouselIndex] = useState(0);
    const searchQuery = useQuery({
        queryKey: ['search', 'contents', { q, subject, grade, tag }],
        queryFn: async () => {
            const { data } = await api.get('/search/contents', {
                params: {
                    q: q || undefined,
                    subject: subject || undefined,
                    gradeLevel: grade || undefined,
                    tag: tag || undefined,
                    page: 1,
                    pageSize: 24,
                },
            });
            return data;
        },
    });
    const items = searchQuery.data?.items ?? [];
    const facets = searchQuery.data?.facets;
    const total = searchQuery.data?.total ?? 0;
    const suggestionSourceId = items[0]?.id ?? items[0]?.contentId;
    const suggestionsQuery = useQuery({
        queryKey: ['search', 'more-like-this', suggestionSourceId],
        queryFn: async () => {
            const { data } = await api.get(`/search/more-like-this/${suggestionSourceId}`, { params: { size: 8 } });
            return data.items;
        },
        enabled: Boolean(suggestionSourceId),
    });
    const suggestions = suggestionsQuery.data ?? [];
    const visibleSuggestions = useMemo(() => {
        if (suggestions.length <= 3)
            return suggestions;
        const slice = [];
        for (let i = 0; i < 3; i += 1) {
            slice.push(suggestions[(carouselIndex + i) % suggestions.length]);
        }
        return slice;
    }, [suggestions, carouselIndex]);
    function toggleParam(key, value) {
        setParams((p) => {
            const current = p.get(key === 'grade' ? 'grade' : key) ?? '';
            if (current === value)
                p.delete(key === 'grade' ? 'grade' : key);
            else
                p.set(key === 'grade' ? 'grade' : key, value);
            return p;
        });
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "\u0130\u00E7erik Ke\u015Ffi" }), _jsxs("div", { className: "bg-white p-4 border rounded-lg flex flex-wrap gap-3 mb-6", children: [_jsx("input", { className: "input flex-1 min-w-[240px]", placeholder: "Ba\u015Fl\u0131k, etiket veya a\u00E7\u0131klama ara\u2026", defaultValue: q, onKeyDown: (e) => {
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
                        } }), (subject || grade || tag) && (_jsx("button", { type: "button", className: "text-sm text-brand-700 hover:underline", onClick: () => setParams((p) => {
                            p.delete('subject');
                            p.delete('grade');
                            p.delete('tag');
                            return p;
                        }), children: "Filtreleri temizle" }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6", children: [_jsxs("aside", { className: "space-y-4", children: [_jsx(FacetGroup, { title: "Ders", buckets: facets?.subject ?? [], active: subject, onSelect: (v) => toggleParam('subject', String(v)), linkPrefix: "/category" }), _jsx(FacetGroup, { title: "S\u0131n\u0131f", buckets: facets?.gradeLevel ?? [], active: grade, onSelect: (v) => toggleParam('grade', String(v)), formatLabel: (v) => `${v}. sınıf` }), _jsx(FacetGroup, { title: "Etiket", buckets: facets?.tags ?? [], active: tag, onSelect: (v) => toggleParam('tag', String(v)) })] }), _jsxs("section", { children: [_jsxs("p", { className: "text-sm text-gray-500 mb-4", children: [total, " sonu\u00E7"] }), searchQuery.isLoading ? (_jsx("p", { children: "Y\u00FCkleniyor\u2026" })) : (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", children: [items.map((it) => (_jsx(ContentCard, { item: it }, it.id))), items.length === 0 && (_jsx("p", { className: "text-slate-500 col-span-full", children: "Sonu\u00E7 bulunamad\u0131." }))] })), suggestions.length > 0 && (_jsxs("div", { className: "mt-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "text-lg font-semibold", children: "\u00D6nerilen i\u00E7erikler" }), suggestions.length > 3 && (_jsxs("div", { className: "flex gap-1", children: [_jsx("button", { type: "button", "aria-label": "\u00D6nceki \u00F6neriler", className: "p-2 rounded-lg border hover:bg-slate-50", onClick: () => setCarouselIndex((i) => (i - 1 + suggestions.length) % suggestions.length), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx("button", { type: "button", "aria-label": "Sonraki \u00F6neriler", className: "p-2 rounded-lg border hover:bg-slate-50", onClick: () => setCarouselIndex((i) => (i + 1) % suggestions.length), children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }))] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: visibleSuggestions.map((it) => (_jsx(ContentCard, { item: it, compact: true }, `suggestion-${it.id}`))) })] }))] })] })] }));
}
function FacetGroup({ title, buckets, active, onSelect, formatLabel, linkPrefix, }) {
    if (buckets.length === 0)
        return null;
    return (_jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-800 mb-2", children: title }), _jsx("ul", { className: "space-y-1 max-h-48 overflow-y-auto", children: buckets.map((b) => {
                    const value = String(b.value);
                    const label = formatLabel ? formatLabel(b.value) : value;
                    const isActive = active === value;
                    return (_jsx("li", { children: linkPrefix ? (_jsxs(Link, { to: `${linkPrefix}/${encodeURIComponent(value)}`, className: `flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-slate-50 ${isActive ? 'bg-brand-50 text-brand-800 font-medium' : 'text-slate-700'}`, children: [_jsx("span", { children: label }), _jsx("span", { className: "text-xs text-slate-400", children: b.count })] })) : (_jsxs("button", { type: "button", onClick: () => onSelect(b.value), className: `flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-slate-50 ${isActive ? 'bg-brand-50 text-brand-800 font-medium' : 'text-slate-700'}`, children: [_jsx("span", { children: label }), _jsx("span", { className: "text-xs text-slate-400", children: b.count })] })) }, value));
                }) })] }));
}
function ContentCard({ item, compact }) {
    return (_jsxs(Link, { to: `/contents/${item.slug}`, className: `border rounded-lg p-4 hover:shadow transition bg-white block ${compact ? 'h-full' : ''}`, children: [_jsxs("div", { className: "text-xs text-gray-500 mb-1", children: [item.subject, " ", item.gradeLevel ? `· ${item.gradeLevel}. sınıf` : ''] }), _jsx("h3", { className: `font-semibold ${compact ? 'text-base' : 'text-lg'}`, children: item.title }), !compact && item.description && (_jsx("p", { className: "text-sm text-gray-600 mt-2 line-clamp-3", children: item.description })), _jsx("div", { className: "flex flex-wrap gap-1 mt-3", children: item.tags?.slice(0, compact ? 2 : 4).map((t) => (_jsx("span", { className: "text-xs bg-gray-100 rounded px-2 py-0.5", children: t }, t))) }), _jsxs("div", { className: "text-xs text-gray-500 mt-3 flex gap-3", children: [_jsxs("span", { children: ["\uD83D\uDC41 ", item.views ?? 0] }), _jsxs("span", { children: ["\u2665 ", item.likes ?? 0] })] })] }));
}
