import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
export default function CollectionsPage() {
    const [collections, setCollections] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/users/me/collections')
            .then(({ data }) => setCollections(data))
            .finally(() => setLoading(false));
    }, []);
    async function createCollection(e) {
        e.preventDefault();
        if (!name.trim())
            return;
        const { data } = await api.post('/users/me/collections', { name: name.trim(), isPublic: false });
        setCollections([data, ...collections]);
        setName('');
    }
    async function removeCollection(id) {
        if (!confirm('Koleksiyon silinsin mi?'))
            return;
        await api.delete(`/users/me/collections/${id}`);
        setCollections(collections.filter((c) => c.id !== id));
    }
    if (loading)
        return _jsx("p", { className: "p-6", children: "Y\u00FCkleniyor\u2026" });
    return (_jsxs("div", { className: "max-w-3xl", children: [_jsxs("header", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-extrabold", children: "Koleksiyonlar\u0131m" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "\u0130\u00E7erikleri gruplay\u0131n ve daha sonra kolayca bulun." })] }), _jsxs("form", { onSubmit: createCollection, className: "flex gap-2 mb-6", children: [_jsx("input", { className: "input flex-1", placeholder: "Yeni koleksiyon ad\u0131", value: name, onChange: (e) => setName(e.target.value) }), _jsxs("button", { type: "submit", className: "btn-primary inline-flex items-center gap-1", children: [_jsx(FolderPlus, { className: "w-4 h-4" }), " Olu\u015Ftur"] })] }), _jsxs("ul", { className: "space-y-3", children: [collections.map((c) => (_jsxs("li", { className: "bg-white border rounded-lg p-4 flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-semibold", children: c.name }), c.description && _jsx("p", { className: "text-sm text-gray-600", children: c.description }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [c.items.length, " i\u00E7erik \u00B7 ", c.isPublic ? 'Herkese açık' : 'Özel'] })] }), _jsx("button", { type: "button", onClick: () => removeCollection(c.id), className: "text-red-600 p-2 hover:bg-red-50 rounded", "aria-label": "Sil", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }, c.id))), collections.length === 0 && (_jsx("li", { className: "text-sm text-gray-500 border border-dashed rounded-lg p-6 text-center", children: "Hen\u00FCz koleksiyon yok. \u0130\u00E7erik detay sayfas\u0131ndan koleksiyona ekleyebilirsiniz." }))] }), _jsx("p", { className: "mt-4 text-sm", children: _jsx(Link, { to: "/discover", className: "text-brand-600 hover:underline", children: "Ke\u015Ffet \u2192" }) })] }));
}
