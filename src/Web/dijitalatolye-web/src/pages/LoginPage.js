import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
            setUser(email, data.roles ?? []);
            const isEditor = (data.roles ?? []).some(r => ["Editor", "Admin", "SuperAdmin"].includes(r));
            navigate(isEditor ? "/editor/queue" : "/teacher/contents/new");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Giriş başarısız.");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("section", { className: "max-w-sm mx-auto px-4 py-16", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Giri\u015F Yap" }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsx("input", { type: "email", placeholder: "E-posta", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-3 py-2 border rounded" }), _jsx("input", { type: "password", placeholder: "\u015Eifre", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "w-full px-3 py-2 border rounded" }), error && _jsx("p", { className: "text-red-600 text-sm", children: error }), _jsx("button", { disabled: loading, className: "w-full px-3 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60", children: loading ? "Giriş yapılıyor..." : "Giriş Yap" })] })] }));
}
