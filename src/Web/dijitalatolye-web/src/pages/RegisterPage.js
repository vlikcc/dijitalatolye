import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", displayName: "", password: "", role: "Teacher" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/register", form);
            navigate("/login");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Kayıt başarısız.");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("section", { className: "max-w-sm mx-auto px-4 py-16", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Kay\u0131t Ol" }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsx("input", { placeholder: "G\u00F6r\u00FCnen ad", value: form.displayName, onChange: (e) => setForm({ ...form, displayName: e.target.value }), required: true, className: "w-full px-3 py-2 border rounded" }), _jsx("input", { type: "email", placeholder: "E-posta", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true, className: "w-full px-3 py-2 border rounded" }), _jsx("input", { type: "password", placeholder: "\u015Eifre (min 8)", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true, minLength: 8, className: "w-full px-3 py-2 border rounded" }), _jsxs("select", { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), className: "w-full px-3 py-2 border rounded", children: [_jsx("option", { value: "Teacher", children: "\u00D6\u011Fretmen" }), _jsx("option", { value: "Student", children: "\u00D6\u011Frenci" })] }), error && _jsx("p", { className: "text-red-600 text-sm", children: error }), _jsx("button", { disabled: loading, className: "w-full px-3 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60", children: loading ? "Kaydediliyor..." : "Kayıt Ol" })] })] }));
}
