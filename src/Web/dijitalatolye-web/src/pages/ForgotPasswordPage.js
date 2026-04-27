import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        }
        catch {
            // Bilgi sızdırmamak için her durumda başarı gösterilir
            setSent(true);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("section", { className: "relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50", "aria-hidden": true }), _jsx("div", { className: "absolute -top-32 -left-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "relative w-full max-w-md", children: _jsxs("div", { className: "rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-6", children: [_jsx("span", { className: "inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsx("span", { className: "text-sm font-semibold text-brand-700", children: "DijitalAt\u00F6lye" })] }), _jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "\u015Eifremi unuttum" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "E-posta adresinizi girin; s\u0131f\u0131rlama ba\u011Flant\u0131s\u0131n\u0131 g\u00F6nderelim." }), sent ? (_jsxs("div", { className: "mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), " E-posta yolda"] }), _jsxs("p", { className: "mt-1.5 text-emerald-700", children: ["E\u011Fer ", _jsx("strong", { children: email }), " sistemimizde kay\u0131tl\u0131ysa, s\u0131f\u0131rlama ba\u011Flant\u0131s\u0131n\u0131 dakikalar i\u00E7inde al\u0131rs\u0131n\u0131z. Gelen kutusunu ve spam klas\u00F6r\u00FCn\u00FC kontrol edin."] })] })) : (_jsxs("form", { onSubmit: onSubmit, className: "mt-6 space-y-4", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: "E-posta" }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "ornek@meb.gov.tr", className: "w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" })] })] }), error && _jsx("p", { className: "text-rose-700 text-sm", children: error }), _jsxs("button", { disabled: loading, className: "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(ArrowRight, { className: "w-4 h-4" }), loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"] })] })), _jsx("p", { className: "mt-6 text-sm text-center text-slate-600", children: _jsx(Link, { to: "/login", className: "font-semibold text-brand-700 hover:text-brand-800", children: "Giri\u015Fe d\u00F6n" }) })] }) })] }));
}
