import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api
            .get('/admin/dashboard')
            .then(({ data }) => setStats(data))
            .catch(() => setStats({
            totalContents: 0,
            pendingReview: 0,
            publishedToday: 0,
            activeEditors: 0,
            totalUsers: 0,
            llmDailyCostUsd: 0,
        }))
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return _jsx("p", { className: "p-6", children: "Y\u00FCkleniyor\u2026" });
    if (!stats)
        return _jsx("p", { className: "p-6", children: "Veri yok." });
    const cards = [
        { label: 'Toplam İçerik', value: stats.totalContents },
        { label: 'İncelemede', value: stats.pendingReview },
        { label: 'Bugün Yayınlanan', value: stats.publishedToday },
        { label: 'Aktif Editör', value: stats.activeEditors },
        { label: 'Kullanıcı', value: stats.totalUsers },
        { label: 'AI Maliyeti (bugün)', value: `$${stats.llmDailyCostUsd.toFixed(2)}` },
    ];
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Y\u00F6netim Paneli" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: cards.map((c) => (_jsxs("div", { className: "bg-white border rounded-lg p-5", children: [_jsx("p", { className: "text-sm text-gray-500", children: c.label }), _jsx("p", { className: "text-2xl font-bold mt-2", children: c.value })] }, c.label))) }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4 mt-8", children: [_jsx(AdminQuickLink, { href: "/admin/contents", label: "\u0130\u00E7erik Y\u00F6netimi" }), _jsx(AdminQuickLink, { href: "/admin/users", label: "Kullan\u0131c\u0131lar" }), _jsx(AdminQuickLink, { href: "/admin/catalog", label: "M\u00FCfredat / Kazan\u0131m" }), _jsx(AdminQuickLink, { href: "/admin/audit", label: "Audit Log" }), _jsx(AdminQuickLink, { href: "/admin/ai", label: "AI Konfig\u00FCrasyon" })] })] }));
}
function AdminQuickLink({ href, label }) {
    return (_jsx(Link, { to: href, className: "block bg-white border rounded-lg p-5 hover:shadow transition", children: _jsx("span", { className: "font-medium", children: label }) }));
}
