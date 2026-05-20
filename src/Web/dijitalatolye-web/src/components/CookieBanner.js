import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const STORAGE_KEY = 'dijitalatolye-cookie-consent';
export default function CookieBanner() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY))
            setVisible(true);
    }, []);
    function accept() {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        setVisible(false);
    }
    if (!visible)
        return null;
    return (_jsx("div", { className: "fixed bottom-0 inset-x-0 z-50 p-4", children: _jsxs("div", { className: "max-w-4xl mx-auto bg-white border shadow-lg rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between", children: [_jsxs("p", { className: "text-sm text-slate-700", children: ["Deneyiminizi iyile\u015Ftirmek i\u00E7in \u00E7erezler kullan\u0131yoruz.", ' ', _jsx("a", { href: "/kvkk", className: "text-brand-600 underline", children: "KVKK" })] }), _jsx("button", { type: "button", onClick: accept, className: "btn-primary shrink-0", children: "Kabul et" })] }) }));
}
