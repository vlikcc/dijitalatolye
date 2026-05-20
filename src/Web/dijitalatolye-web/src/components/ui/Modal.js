import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
export default function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => { if (e.key === 'Escape')
            onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/40", "aria-label": "Kapat", onClick: onClose }), _jsxs("div", { className: "relative bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: title }), _jsx("button", { type: "button", onClick: onClose, className: "p-1 rounded hover:bg-gray-100", "aria-label": "Kapat", children: _jsx(X, { className: "w-5 h-5" }) })] }), children] })] }));
}
