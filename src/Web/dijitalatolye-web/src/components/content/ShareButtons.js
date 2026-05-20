import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link2, Share2 } from 'lucide-react';
export default function ShareButtons({ title, url, onQr, onEmbed }) {
    const encoded = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    async function copyLink() {
        await navigator.clipboard.writeText(url);
    }
    function nativeShare() {
        if (navigator.share)
            void navigator.share({ title, url });
        else
            void copyLink();
    }
    return (_jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsxs("button", { type: "button", onClick: nativeShare, className: "btn-secondary inline-flex items-center gap-1", children: [_jsx(Share2, { className: "w-4 h-4" }), " Payla\u015F"] }), _jsx("a", { href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, target: "_blank", rel: "noopener noreferrer", className: "btn-secondary text-sm", children: "X" }), _jsx("a", { href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, target: "_blank", rel: "noopener noreferrer", className: "btn-secondary text-sm", children: "Facebook" }), _jsx("a", { href: `https://wa.me/?text=${encodedTitle}%20${encoded}`, target: "_blank", rel: "noopener noreferrer", className: "btn-secondary text-sm", children: "WhatsApp" }), _jsx("button", { type: "button", onClick: onQr, className: "btn-secondary text-sm", children: "QR" }), _jsxs("button", { type: "button", onClick: onEmbed, className: "btn-secondary text-sm inline-flex items-center gap-1", children: [_jsx(Link2, { className: "w-4 h-4" }), " G\u00F6m"] }), _jsx("button", { type: "button", onClick: copyLink, className: "btn-secondary text-sm", children: "Link kopyala" })] }));
}
