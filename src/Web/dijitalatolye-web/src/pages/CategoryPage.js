import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
export default function CategoryPage() {
    const { subject = '' } = useParams();
    const decodedSubject = decodeURIComponent(subject);
    const [params] = useSearchParams();
    const grade = params.get('grade') ?? '';
    const { data, isLoading } = useQuery({
        queryKey: ['search', 'category', decodedSubject, grade],
        queryFn: async () => {
            const { data: resp } = await api.get('/search/contents', {
                params: {
                    subject: decodedSubject,
                    gradeLevel: grade || undefined,
                    page: 1,
                    pageSize: 24,
                },
            });
            return resp;
        },
        enabled: Boolean(decodedSubject),
    });
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6", children: [_jsxs("nav", { className: "text-sm text-slate-500 mb-4", children: [_jsx(Link, { to: "/discover", className: "hover:text-brand-700", children: "Ke\u015Ffet" }), _jsx("span", { className: "mx-2", children: "/" }), _jsx("span", { className: "text-slate-800", children: decodedSubject })] }), _jsxs("h1", { className: "text-3xl font-bold mb-2", children: [decodedSubject, " i\u00E7erikleri"] }), _jsxs("p", { className: "text-sm text-gray-500 mb-6", children: [data?.total ?? 0, " sonu\u00E7"] }), isLoading ? (_jsx("p", { children: "Y\u00FCkleniyor\u2026" })) : (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [(data?.items ?? []).map((it) => (_jsxs(Link, { to: `/contents/${it.slug}`, className: "border rounded-lg p-4 hover:shadow transition bg-white", children: [_jsx("div", { className: "text-xs text-gray-500 mb-1", children: it.gradeLevel ? `${it.gradeLevel}. sınıf` : '' }), _jsx("h3", { className: "font-semibold text-lg", children: it.title }), it.description && (_jsx("p", { className: "text-sm text-gray-600 mt-2 line-clamp-3", children: it.description })), _jsx("div", { className: "flex flex-wrap gap-1 mt-3", children: it.tags?.slice(0, 4).map((t) => (_jsx("span", { className: "text-xs bg-gray-100 rounded px-2 py-0.5", children: t }, t))) })] }, it.id))), (data?.items ?? []).length === 0 && (_jsx("p", { className: "text-slate-500 col-span-full", children: "Bu kategoride hen\u00FCz i\u00E7erik yok." }))] })), _jsx("p", { className: "mt-8 text-sm", children: _jsx(Link, { to: `/discover?subject=${encodeURIComponent(decodedSubject)}`, className: "text-brand-700 hover:underline", children: "Geli\u015Fmi\u015F filtrelerle ara \u2192" }) })] }));
}
