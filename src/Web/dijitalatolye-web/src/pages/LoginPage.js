import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/state/auth";
export default function LoginPage() {
    const navigate = useNavigate();
    const { setTokens, setUser } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            setTokens(data.accessToken, data.refreshToken);
            const roles = data.roles ?? rolesFromJwt(data.accessToken);
            setUser(email, roles);
            if (roles.some((r) => ["Admin", "SuperAdmin"].includes(r))) {
                navigate("/admin");
            }
            else if (roles.some((r) => ["Editor"].includes(r))) {
                navigate("/editor/queue");
            }
            else {
                navigate("/teacher/contents/new");
            }
        }
        catch (err) {
            const msg = extractApiError(err) ?? "Giriş başarısız. E-posta veya şifre hatalı olabilir.";
            setError(msg);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("section", { className: "relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50", "aria-hidden": true }), _jsx("div", { className: "absolute -top-32 -left-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "relative w-full max-w-md", children: _jsxs("div", { className: "rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-6", children: [_jsx("span", { className: "inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsx("span", { className: "text-sm font-semibold text-brand-700", children: "DijitalAt\u00F6lye" })] }), _jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Tekrar ho\u015F geldiniz" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Hesab\u0131n\u0131za giri\u015F yaparak i\u00E7erik \u00FCretmeye devam edin." }), _jsxs("form", { onSubmit: onSubmit, className: "mt-6 space-y-4", children: [_jsx(Field, { icon: Mail, type: "email", placeholder: "ornek@meb.gov.tr", label: "E-posta", value: email, onChange: setEmail, autoComplete: "email" }), _jsx(Field, { icon: Lock, type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", label: "\u015Eifre", value: password, onChange: setPassword, autoComplete: "current-password" }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("label", { className: "inline-flex items-center gap-2 text-slate-600", children: [_jsx("input", { type: "checkbox", className: "rounded text-brand-600 focus:ring-brand-500" }), "Beni hat\u0131rla"] }), _jsx(Link, { to: "/forgot-password", className: "text-brand-700 hover:text-brand-800 font-medium", children: "\u015Eifremi unuttum" })] }), error && (_jsx("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700", children: error })), _jsxs("button", { disabled: loading, className: "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition", children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(ArrowRight, { className: "w-4 h-4" }), loading ? "Giriş yapılıyor..." : "Giriş Yap"] })] }), _jsxs("p", { className: "mt-6 text-sm text-center text-slate-600", children: ["Hesab\u0131n\u0131z yok mu?", " ", _jsx(Link, { to: "/register", className: "font-semibold text-brand-700 hover:text-brand-800", children: "\u00DCcretsiz kay\u0131t olun" })] })] }) })] }));
}
function Field({ icon: Icon, type, placeholder, label, value, onChange, autoComplete, }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: label }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Icon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: type, required: true, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, autoComplete: autoComplete, className: "w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" })] })] }));
}
function rolesFromJwt(token) {
    try {
        const payload = token.split(".")[1];
        const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
        const json = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
        const claim = json.role ?? json.roles ?? [];
        return Array.isArray(claim) ? claim : [claim];
    }
    catch {
        return [];
    }
}
function extractApiError(err) {
    if (typeof err === "object" && err !== null && "response" in err) {
        const r = err.response;
        return r?.data?.detail ?? r?.data?.title ?? r?.data?.message ?? null;
    }
    return null;
}
