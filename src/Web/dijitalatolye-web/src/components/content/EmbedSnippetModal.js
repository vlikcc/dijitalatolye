import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
export default function EmbedSnippetModal({ open, onClose, slug }) {
    const playUrl = `${window.location.origin}/play/${slug}`;
    const snippet = `<iframe src="${playUrl}" width="800" height="600" frameborder="0" sandbox="allow-scripts allow-same-origin" title="${slug}"></iframe>`;
    const [copied, setCopied] = useState(false);
    async function copy() {
        await navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "G\u00F6mme Kodu", children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Bu kodu web sitenize yap\u0131\u015Ft\u0131rarak i\u00E7eri\u011Fi g\u00F6mebilirsiniz." }), _jsx("pre", { className: "text-xs bg-gray-50 border rounded p-3 overflow-x-auto whitespace-pre-wrap", children: snippet }), _jsx("button", { type: "button", onClick: copy, className: "btn-secondary mt-3", children: copied ? 'Kopyalandı ✓' : 'Kodu kopyala' })] }));
}
