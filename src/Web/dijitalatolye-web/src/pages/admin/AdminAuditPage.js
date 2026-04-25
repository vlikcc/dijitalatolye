import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
const SEVERITY_COLORS = {
    Info: 'bg-blue-50 text-blue-700',
    Warning: 'bg-amber-50 text-amber-700',
    Error: 'bg-red-50 text-red-700',
    Critical: 'bg-red-100 text-red-900',
};
export default function AdminAuditPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState('');
    const [severity, setSeverity] = useState('');
    const [page, setPage] = useState(1);
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: page.toString(), pageSize: '50' });
        if (action)
            params.set('action', action);
        if (severity)
            params.set('severity', severity);
        api
            .get(`/admin/audit?${params.toString()}`)
            .then(({ data }) => setData(data))
            .catch(() => setData({ total: 0, page: 1, pageSize: 50, items: [] }))
            .finally(() => setLoading(false));
    }, [action, severity, page]);
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Audit Log" }), _jsxs("div", { className: "flex gap-3 mb-4", children: [_jsx("input", { className: "border rounded px-3 py-2", placeholder: "Eylem (\u00F6r. content.published)", value: action, onChange: (e) => {
                            setAction(e.target.value);
                            setPage(1);
                        } }), _jsxs("select", { className: "border rounded px-3 py-2", value: severity, onChange: (e) => {
                            setSeverity(e.target.value);
                            setPage(1);
                        }, children: [_jsx("option", { value: "", children: "Tum Seviyeler" }), _jsx("option", { value: "Info", children: "Info" }), _jsx("option", { value: "Warning", children: "Warning" }), _jsx("option", { value: "Error", children: "Error" }), _jsx("option", { value: "Critical", children: "Critical" })] })] }), loading ? (_jsx("p", { children: "Yukleniyor..." })) : (_jsxs("div", { className: "bg-white border rounded-lg overflow-hidden", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "p-3", children: "Zaman" }), _jsx("th", { className: "p-3", children: "Servis" }), _jsx("th", { className: "p-3", children: "Eylem" }), _jsx("th", { className: "p-3", children: "Kullanici" }), _jsx("th", { className: "p-3", children: "Entity" }), _jsx("th", { className: "p-3", children: "IP" }), _jsx("th", { className: "p-3", children: "Seviye" })] }) }), _jsxs("tbody", { children: [data?.items.map((e) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-3 whitespace-nowrap text-gray-500", children: new Date(e.occurredAt).toLocaleString('tr-TR') }), _jsx("td", { className: "p-3", children: e.serviceName }), _jsx("td", { className: "p-3 font-mono text-xs", children: e.action }), _jsx("td", { className: "p-3", children: e.userName ?? e.userId?.slice(0, 8) ?? '-' }), _jsx("td", { className: "p-3 text-xs", children: e.entityType ? `${e.entityType}/${e.entityId?.slice(0, 8) ?? ''}` : '-' }), _jsx("td", { className: "p-3 text-xs", children: e.ipAddress ?? '-' }), _jsx("td", { className: "p-3", children: _jsx("span", { className: `px-2 py-0.5 rounded text-xs ${SEVERITY_COLORS[e.severity] ?? 'bg-gray-100'}`, children: e.severity }) })] }, e.id))), data && data.items.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "p-6 text-center text-gray-500", children: "Kayit bulunamadi." }) }))] })] }), data && (_jsxs("div", { className: "flex items-center justify-between p-3 border-t bg-gray-50 text-sm", children: [_jsxs("span", { children: ["Toplam: ", data.total, " | Sayfa: ", data.page] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-1 border rounded disabled:opacity-50", onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: "Onceki" }), _jsx("button", { className: "px-3 py-1 border rounded disabled:opacity-50", onClick: () => setPage((p) => p + 1), disabled: data.items.length < data.pageSize, children: "Sonraki" })] })] }))] }))] }));
}
