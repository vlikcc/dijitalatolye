import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [pendingId, setPendingId] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (q.trim())
            params.set('q', q.trim());
        if (roleFilter !== 'all')
            params.set('role', roleFilter);
        api
            .get(`/admin/users${params.toString() ? `?${params}` : ''}`)
            .then(({ data }) => setUsers(data))
            .catch((e) => {
            setUsers([]);
            setError(e?.response?.status === 403
                ? 'Bu sayfa için Admin yetkisi gerekli.'
                : 'Kullanıcılar yüklenemedi.');
        })
            .finally(() => setLoading(false));
    }, [q, roleFilter, reloadKey]);
    const onToggleEditor = async (u) => {
        const isEditor = u.roles.includes('Editor');
        const action = isEditor ? 'revoke' : 'grant';
        const confirmMsg = isEditor
            ? `${u.email} kullanıcısının Editör yetkisini kaldırmak istediğinize emin misiniz?`
            : `${u.email} kullanıcısına Editör yetkisi vermek istediğinize emin misiniz?`;
        if (!window.confirm(confirmMsg))
            return;
        setPendingId(u.id);
        setError(null);
        try {
            await api.post(`/admin/users/${u.id}/roles/${action}`, { role: 'Editor' });
            setReloadKey((k) => k + 1);
        }
        catch (e) {
            const detail = e?.response?.data;
            setError(detail?.detail || detail?.title || 'İşlem başarısız.');
        }
        finally {
            setPendingId(null);
        }
    };
    const counts = useMemo(() => {
        const c = { total: users.length, teacher: 0, editor: 0 };
        for (const u of users) {
            if (u.roles.includes('Teacher'))
                c.teacher++;
            if (u.roles.includes('Editor'))
                c.editor++;
        }
        return c;
    }, [users]);
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("header", { className: "flex items-end justify-between mb-6 flex-wrap gap-3", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Kullan\u0131c\u0131lar" }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Toplam ", counts.total, " \u00B7 \u00D6\u011Fretmen ", counts.teacher, " \u00B7 Edit\u00F6r ", counts.editor, ". Edit\u00F6r atamas\u0131 yaln\u0131zca kay\u0131tl\u0131 \u00F6\u011Fretmenlere yap\u0131labilir."] })] }) }), _jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [_jsx("input", { className: "border rounded px-3 py-2 w-80", placeholder: "E-posta veya isim...", value: q, onChange: (e) => setQ(e.target.value) }), _jsxs("select", { className: "border rounded px-3 py-2", value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), children: [_jsx("option", { value: "all", children: "T\u00FCm roller" }), _jsx("option", { value: "Teacher", children: "\u00D6\u011Fretmenler" }), _jsx("option", { value: "Editor", children: "Edit\u00F6rler" }), _jsx("option", { value: "Student", children: "\u00D6\u011Frenciler" })] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm", children: error })), loading ? (_jsx("p", { children: "Y\u00FCkleniyor..." })) : (_jsx("div", { className: "bg-white border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "p-3", children: "Ad" }), _jsx("th", { className: "p-3", children: "E-posta" }), _jsx("th", { className: "p-3", children: "Roller" }), _jsx("th", { className: "p-3", children: "Do\u011Frulanm\u0131\u015F" }), _jsx("th", { className: "p-3", children: "Kay\u0131t" }), _jsx("th", { className: "p-3 text-right", children: "\u0130\u015Flemler" })] }) }), _jsxs("tbody", { children: [users.map((u) => {
                                    const isEditor = u.roles.includes('Editor');
                                    const isAdmin = u.roles.includes('Admin') || u.roles.includes('SuperAdmin');
                                    const isTeacher = u.roles.includes('Teacher');
                                    const canGrantEditor = !isAdmin && isTeacher && !isEditor;
                                    const canRevokeEditor = !isAdmin && isEditor;
                                    return (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-3", children: u.displayName || '-' }), _jsx("td", { className: "p-3", children: u.email }), _jsx("td", { className: "p-3 text-xs", children: _jsx("div", { className: "flex flex-wrap gap-1", children: u.roles.map((r) => (_jsx("span", { className: `px-2 py-0.5 rounded ${r === 'Editor'
                                                            ? 'bg-indigo-100 text-indigo-800'
                                                            : r === 'Admin' || r === 'SuperAdmin'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : r === 'Teacher'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-gray-100 text-gray-700'}`, children: r }, r))) }) }), _jsxs("td", { className: "p-3", children: [u.isVerified ? 'Evet' : 'Hayır', u.mebVerified && (_jsx("span", { className: "ml-1 text-xs text-emerald-600", children: "(MEB)" }))] }), _jsx("td", { className: "p-3 text-gray-500", children: new Date(u.createdAt).toLocaleDateString('tr-TR') }), _jsx("td", { className: "p-3 text-right", children: isAdmin ? (_jsx("span", { className: "text-xs text-gray-400", children: "\u2014" })) : canRevokeEditor ? (_jsx("button", { type: "button", disabled: pendingId === u.id, onClick: () => onToggleEditor(u), className: `px-3 py-1.5 rounded text-xs font-medium border transition bg-white text-red-700 border-red-300 hover:bg-red-50 ${pendingId === u.id ? 'opacity-50 cursor-wait' : ''}`, children: pendingId === u.id ? 'İşleniyor...' : 'Editör Yetkisini Al' })) : canGrantEditor ? (_jsx("button", { type: "button", disabled: pendingId === u.id, onClick: () => onToggleEditor(u), className: `px-3 py-1.5 rounded text-xs font-medium border transition bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 ${pendingId === u.id ? 'opacity-50 cursor-wait' : ''}`, children: pendingId === u.id ? 'İşleniyor...' : 'Editör Yap' })) : (_jsx("span", { className: "text-xs text-gray-400", title: "Edit\u00F6r yaln\u0131zca \u00F6\u011Fretmen hesaplar\u0131na atan\u0131r", children: "\u2014" })) })] }, u.id));
                                }), users.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "p-6 text-center text-gray-500", children: "Kullan\u0131c\u0131 bulunamad\u0131." }) }))] })] }) }))] }));
}
