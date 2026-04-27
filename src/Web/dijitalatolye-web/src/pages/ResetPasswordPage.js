import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError("Şifre en az 8 karakter olmalı.");
            return;
        }
        if (password !== confirm) {
            setError("Şifreler eşleşmiyor.");
            return;
        }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { email, token, newPassword: password });
            navigate("/login?reset=1");
        }
        catch (err) {
            const r = err.response;
            setError(r?.data?.detail ?? r?.data?.title ?? "Sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("section", { className: "relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50", "aria-hidden": true }), _jsx("div", { className: "absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "relative w-full max-w-md", children: _jsxs("div", { className: "rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-6", children: [_jsx("span", { className: "inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsx("span", { className: "text-sm font-semibold text-brand-700", children: "DijitalAt\u00F6lye" })] }), _jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Yeni \u015Fifre belirleyin" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Hesap g\u00FCvenli\u011Fi i\u00E7in en az 8 karakterli, tahmin edilmesi zor bir \u015Fifre se\u00E7in." }), (!token || !email) && (_jsx("div", { className: "mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800", children: "Ba\u011Flant\u0131 eksik veya ge\u00E7ersiz. L\u00FCtfen e-postadaki s\u0131f\u0131rlama ba\u011Flant\u0131s\u0131n\u0131n tamam\u0131n\u0131 kullan\u0131n." })), _jsxs("form", { onSubmit: onSubmit, className: "mt-6 space-y-4", children: [_jsx(PasswordField, { label: "Yeni \u015Fifre", value: password, onChange: setPassword }), _jsx(PasswordField, { label: "Yeni \u015Fifre (tekrar)", value: confirm, onChange: setConfirm }), error && (_jsx("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700", children: error })), _jsxs("button", { disabled: loading || !token || !email, className: "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(ArrowRight, { className: "w-4 h-4" }), loading ? "Kaydediliyor..." : "Şifreyi değiştir"] })] }), _jsx("p", { className: "mt-6 text-sm text-center text-slate-600", children: _jsx(Link, { to: "/login", className: "font-semibold text-brand-700 hover:text-brand-800", children: "Giri\u015Fe d\u00F6n" }) })] }) })] }));
}
function PasswordField({ label, value, onChange }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: label }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "password", required: true, minLength: 8, value: value, onChange: (e) => onChange(e.target.value), autoComplete: "new-password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" })] })] }));
}
