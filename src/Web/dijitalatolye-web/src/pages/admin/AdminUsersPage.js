import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    useEffect(() => {
        setLoading(true);
        api
            .get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
            .then(({ data }) => setUsers(data))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    }, [q]);
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Kullanicilar" }), _jsx("input", { className: "border rounded px-3 py-2 w-80 mb-4", placeholder: "E-posta veya isim...", value: q, onChange: (e) => setQ(e.target.value) }), loading ? (_jsx("p", { children: "Yukleniyor..." })) : (_jsx("div", { className: "bg-white border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "p-3", children: "Ad" }), _jsx("th", { className: "p-3", children: "E-posta" }), _jsx("th", { className: "p-3", children: "Roller" }), _jsx("th", { className: "p-3", children: "Dogrulanmis" }), _jsx("th", { className: "p-3", children: "Kayit" })] }) }), _jsxs("tbody", { children: [users.map((u) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-3", children: u.displayName || '-' }), _jsx("td", { className: "p-3", children: u.email }), _jsx("td", { className: "p-3 text-xs", children: u.roles.join(', ') }), _jsx("td", { className: "p-3", children: u.isVerified ? 'Evet' : 'Hayir' }), _jsx("td", { className: "p-3 text-gray-500", children: new Date(u.createdAt).toLocaleDateString('tr-TR') })] }, u.id))), users.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "p-6 text-center text-gray-500", children: "Kullanici bulunamadi." }) }))] })] }) }))] }));
}
