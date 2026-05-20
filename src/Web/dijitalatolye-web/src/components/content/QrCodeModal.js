import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Modal from '@/components/ui/Modal';
export default function QrCodeModal({ open, onClose, url, title }) {
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "QR Kod", children: [_jsx("p", { className: "text-sm text-gray-600 mb-3", children: title }), _jsx("div", { className: "flex justify-center", children: _jsx("img", { src: qrSrc, alt: "QR kod", width: 220, height: 220, className: "border rounded" }) }), _jsx("p", { className: "text-xs text-gray-500 mt-3 break-all", children: url })] }));
}
