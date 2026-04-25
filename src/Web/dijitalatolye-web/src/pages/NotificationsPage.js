import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
export default function NotificationsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    async function load() {
        setLoading(true);
        const { data } = await api.get('/notifications');
        setItems(data);
        setLoading(false);
    }
    async function markRead(id) {
        await api.post(`/notifications/${id}/read`);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    }
    useEffect(() => {
        void load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, []);
    return (_jsxs("div", { className: "max-w-3xl mx-auto p-6", children: [_jsx("h1", { className: "text-2xl font-semibold mb-4", children: "Bildirimler" }), loading && _jsx("p", { children: "Y\u00FCkleniyor\u2026" }), !loading && items.length === 0 && _jsx("p", { className: "text-gray-500", children: "Bildirim yok." }), _jsx("ul", { className: "space-y-2", children: items.map((n) => (_jsx("li", { className: `p-4 border rounded ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: n.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: n.body }), n.url && (_jsx("a", { href: n.url, className: "text-blue-600 text-sm mt-2 inline-block", children: "A\u00E7 \u2192" }))] }), _jsxs("div", { className: "flex flex-col items-end gap-2 ml-3", children: [_jsx("span", { className: "text-xs text-gray-400", children: new Date(n.createdAt).toLocaleString('tr-TR') }), !n.isRead && (_jsx("button", { onClick: () => markRead(n.id), className: "text-xs text-blue-600", children: "Okundu i\u015Faretle" }))] })] }) }, n.id))) })] }));
}
