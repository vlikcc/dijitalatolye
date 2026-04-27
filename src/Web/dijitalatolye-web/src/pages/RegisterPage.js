import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", displayName: "", password: "", role: "Teacher" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const passwordValid = form.password.length >= 8;
    async function onSubmit(e) {
        e.preventDefault();
        if (!passwordValid) {
            setError("Şifre en az 8 karakter olmalı.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/register", form);
            navigate("/login?registered=1");
        }
        catch (err) {
            const msg = extractApiError(err) ?? "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.";
            setError(msg);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("section", { className: "relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50", "aria-hidden": true }), _jsx("div", { className: "absolute -top-32 -right-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "absolute -bottom-32 -left-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "relative w-full max-w-md", children: _jsxs("div", { className: "rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-6", children: [_jsx("span", { className: "inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsx("span", { className: "text-sm font-semibold text-brand-700", children: "DijitalAt\u00F6lye" })] }), _jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "\u00DCcretsiz hesap olu\u015Fturun" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "5 dakikada kay\u0131t olun, ilk i\u00E7eri\u011Finizi yay\u0131na haz\u0131rlay\u0131n." }), _jsxs("form", { onSubmit: onSubmit, className: "mt-6 space-y-4", children: [_jsx(Field, { icon: User, type: "text", placeholder: "Ay\u015Fe Y\u0131lmaz", label: "G\u00F6r\u00FCnen ad", value: form.displayName, onChange: (v) => setForm({ ...form, displayName: v }), autoComplete: "name" }), _jsx(Field, { icon: Mail, type: "email", placeholder: "ornek@meb.gov.tr", label: "E-posta", value: form.email, onChange: (v) => setForm({ ...form, email: v }), autoComplete: "email" }), _jsxs("div", { children: [_jsx(Field, { icon: Lock, type: "password", placeholder: "En az 8 karakter", label: "\u015Eifre", value: form.password, onChange: (v) => setForm({ ...form, password: v }), autoComplete: "new-password" }), form.password.length > 0 && (_jsxs("p", { className: `mt-1 text-xs inline-flex items-center gap-1 ${passwordValid ? "text-emerald-700" : "text-slate-500"}`, children: [_jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), " En az 8 karakter"] }))] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: "Rol" }), _jsxs("select", { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), className: "mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition", children: [_jsx("option", { value: "Teacher", children: "\u00D6\u011Fretmen" }), _jsx("option", { value: "Student", children: "\u00D6\u011Frenci" })] })] }), error && (_jsx("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700", children: error })), _jsxs("p", { className: "text-xs text-slate-500", children: ["Kay\u0131t olarak", " ", _jsx(Link, { to: "/kvkk", className: "text-brand-700 hover:text-brand-800 underline", children: "KVKK ayd\u0131nlatma metnini" }), " ", "okudu\u011Funuzu kabul edersiniz."] }), _jsxs("button", { disabled: loading, className: "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(ArrowRight, { className: "w-4 h-4" }), loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"] })] }), _jsxs("p", { className: "mt-6 text-sm text-center text-slate-600", children: ["Zaten hesab\u0131n\u0131z var m\u0131?", " ", _jsx(Link, { to: "/login", className: "font-semibold text-brand-700 hover:text-brand-800", children: "Giri\u015F yap\u0131n" })] })] }) })] }));
}
function Field({ icon: Icon, type, placeholder, label, value, onChange, autoComplete, }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: label }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Icon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: type, required: true, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, autoComplete: autoComplete, className: "w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" })] })] }));
}
function extractApiError(err) {
    if (typeof err === "object" && err !== null && "response" in err) {
        const r = err.response;
        return r?.data?.detail ?? r?.data?.title ?? r?.data?.message ?? null;
    }
    return null;
}
