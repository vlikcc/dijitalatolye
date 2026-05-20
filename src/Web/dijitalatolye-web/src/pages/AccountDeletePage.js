import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
export default function AccountDeletePage() {
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState(null);
    async function requestDelete() {
        if (!confirm('Hesap silme talebi gönderilecek. Devam edilsin mi?'))
            return;
        setBusy(true);
        setError(null);
        try {
            await api.post('/users/me/kvkk/delete-request');
            setDone(true);
        }
        catch {
            setError('Talep gönderilemedi. Giriş yaptığınızdan emin olun.');
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "Hesap Silme Talebi" }), _jsx("p", { className: "text-gray-600 mb-6", children: "KVKK kapsam\u0131nda hesab\u0131n\u0131z\u0131n ve ki\u015Fisel verilerinizin silinmesini talep edebilirsiniz. Talebiniz 30 g\u00FCn i\u00E7inde i\u015Fleme al\u0131n\u0131r." }), done ? (_jsx("div", { className: "p-4 bg-green-50 text-green-800 rounded-lg", children: "Talebiniz al\u0131nd\u0131. E-posta adresinize onay g\u00F6nderilecektir." })) : (_jsx("button", { type: "button", onClick: requestDelete, disabled: busy, className: "px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50", children: busy ? 'Gönderiliyor…' : 'Hesap silme talebi gönder' })), error && _jsx("p", { className: "mt-4 text-red-700 text-sm", children: error }), _jsx("p", { className: "mt-6 text-sm", children: _jsx(Link, { to: "/kvkk", className: "text-brand-600 hover:underline", children: "\u2190 KVKK sayfas\u0131na d\u00F6n" }) })] }));
}
