import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import api from '@/lib/api';
export default function KvkkPage() {
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState(null);
    async function handleExport() {
        setBusy('export');
        setMessage(null);
        try {
            const { data } = await api.get('/users/me/kvkk/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dijitalatolye-veri-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage('Veri export tamamlandi.');
        }
        catch {
            setMessage('Export sirasinda hata olustu.');
        }
        finally {
            setBusy(null);
        }
    }
    async function handleAnonymize() {
        if (!confirm('Profil bilgileriniz anonimlestirilecek. Devam edilsin mi?'))
            return;
        setBusy('anonymize');
        setMessage(null);
        try {
            await api.post('/users/me/kvkk/anonymize');
            setMessage('Profiliniz anonimlestirildi.');
        }
        catch {
            setMessage('Islem sirasinda hata olustu.');
        }
        finally {
            setBusy(null);
        }
    }
    return (_jsxs("div", { className: "max-w-3xl mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-2", children: "KVKK Haklarim" }), _jsxs("p", { className: "text-gray-600 mb-6", children: ["6698 sayili KVKK kapsaminda kisisel verilerinize iliskin haklarinizi buradan kullanabilirsiniz. Detayli aydinlatma metni icin", ' ', _jsx("a", { className: "text-blue-600 underline", href: "/legal/privacy", children: "Gizlilik Politikasi" }), ' ', "sayfasini ziyaret edin."] }), _jsxs("section", { className: "space-y-4", children: [_jsxs("div", { className: "border rounded-lg p-5 bg-white", children: [_jsx("h2", { className: "font-semibold text-lg mb-1", children: "Verilerimi Indir" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Profilinize ait kayitli verileri JSON olarak indirebilirsiniz." }), _jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50", onClick: handleExport, disabled: busy !== null, children: busy === 'export' ? 'Hazirlaniyor...' : 'Indir' })] }), _jsxs("div", { className: "border rounded-lg p-5 bg-white", children: [_jsx("h2", { className: "font-semibold text-lg mb-1", children: "Profilimi Anonimlestir" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Ad, soyad, biyografi gibi kisisel alanlar anonimlestirilir. Yayinlanmis icerikleriniz ve etkilesim verileriniz icin ayri talep gereklidir." }), _jsx("button", { className: "px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50", onClick: handleAnonymize, disabled: busy !== null, children: busy === 'anonymize' ? 'Isleniyor...' : 'Anonimlestir' })] }), _jsxs("div", { className: "border rounded-lg p-5 bg-white", children: [_jsx("h2", { className: "font-semibold text-lg mb-1", children: "Hesap Silme Talebi" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Hesab\u0131n\u0131z\u0131n tamamen silinmesini talep edebilirsiniz." }), _jsx("a", { href: "/account/delete", className: "px-4 py-2 bg-red-600 text-white rounded inline-block", children: "Hesap silme talebi" })] })] }), message && (_jsx("p", { className: "mt-6 p-3 bg-green-50 text-green-800 rounded", children: message }))] }));
}
