import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, ShieldCheck, Save, Loader2, Download } from "lucide-react";
import { useAuthStore } from "@/state/auth";
import { api } from "@/lib/api";
export default function TeacherProfilePage() {
    const { email, roles } = useAuthStore();
    const [displayName, setDisplayName] = useState("");
    const [school, setSchool] = useState("");
    const [bio, setBio] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [prefs, setPrefs] = useState({
        emailEnabled: true,
        inAppEnabled: true,
        contentUpdates: true,
        marketingEmails: false,
    });
    useEffect(() => {
        api.get("/users/me")
            .then(({ data }) => {
            if (data.displayName)
                setDisplayName(data.displayName);
            if (data.schoolName)
                setSchool(data.schoolName);
            if (data.bio)
                setBio(data.bio ?? "");
        })
            .catch(() => { });
        api.get("/users/me/notification-preferences")
            .then(({ data }) => setPrefs(data))
            .catch(() => { });
    }, []);
    async function onSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.put("/users/me", { displayName, schoolName: school, bio });
            setSaved(true);
        }
        finally {
            setSaving(false);
            setTimeout(() => setSaved(false), 2400);
        }
    }
    async function savePrefs() {
        await api.put("/users/me/notification-preferences", prefs);
        setSaved(true);
        setTimeout(() => setSaved(false), 2400);
    }
    async function exportData() {
        setExporting(true);
        try {
            const { data } = await api.get("/users/me/kvkk/export");
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `dijitalatolye-veri-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        finally {
            setExporting(false);
        }
    }
    return (_jsxs("div", { className: "max-w-3xl", children: [_jsxs("header", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Profil" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "Hesap bilgileriniz ve \u00F6\u011Fretmen profiliniz." })] }), _jsx("div", { className: "rounded-2xl bg-white border border-slate-200 p-6 mb-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-lg", children: (email ?? "?").charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm text-slate-500 inline-flex items-center gap-1.5", children: [_jsx(Mail, { className: "w-3.5 h-3.5" }), " ", email] }), _jsxs("p", { className: "mt-1 text-sm text-slate-500 inline-flex items-center gap-1.5", children: [_jsx(ShieldCheck, { className: "w-3.5 h-3.5" }), " Roller: ", roles.join(", ") || "—"] })] })] }) }), _jsxs("form", { onSubmit: onSubmit, className: "rounded-2xl bg-white border border-slate-200 p-6 space-y-4 mb-6", children: [_jsxs("h2", { className: "font-semibold text-slate-900 inline-flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-brand-600" }), " \u00D6\u011Fretmen Bilgileri"] }), _jsx(Field, { label: "G\u00F6r\u00FCnen ad", value: displayName, onChange: setDisplayName, placeholder: "Ay\u015Fe Y\u0131lmaz" }), _jsx(Field, { label: "Okul / Kurum", value: school, onChange: setSchool, placeholder: "\u00D6rn. Atat\u00FCrk \u0130lkokulu" }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: "Hakk\u0131nda" }), _jsx("textarea", { value: bio, onChange: (e) => setBio(e.target.value), rows: 4, placeholder: "Bran\u015F, deneyim, ilgi alanlar\u0131\u2026", className: "mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition resize-y" })] }), _jsxs("div", { className: "flex items-center justify-between pt-2", children: [saved && _jsx("span", { className: "text-sm text-emerald-700", children: "Kaydedildi \u2713" }), _jsxs("button", { disabled: saving, className: "ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60", children: [saving ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Save, { className: "w-4 h-4" }), "Kaydet"] })] })] }), _jsxs("section", { className: "rounded-2xl bg-white border border-slate-200 p-6 space-y-3 mb-6", children: [_jsx("h2", { className: "font-semibold text-slate-900", children: "Bildirim Tercihleri" }), ["emailEnabled", "inAppEnabled", "contentUpdates", "marketingEmails"].map((key) => (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: prefs[key], onChange: (e) => setPrefs({ ...prefs, [key]: e.target.checked }) }), key === "emailEnabled" && "E-posta bildirimleri", key === "inAppEnabled" && "Uygulama içi bildirimler", key === "contentUpdates" && "İçerik güncellemeleri", key === "marketingEmails" && "Pazarlama e-postaları"] }, key))), _jsx("button", { type: "button", onClick: savePrefs, className: "btn-secondary text-sm", children: "Tercihleri kaydet" })] }), _jsxs("section", { className: "rounded-2xl bg-white border border-slate-200 p-6", children: [_jsx("h2", { className: "font-semibold text-slate-900 mb-2", children: "Verileriniz (KVKK)" }), _jsx("p", { className: "text-sm text-slate-600 mb-3", children: "Profil verilerinizi JSON olarak indirebilir veya hesap silme talebinde bulunabilirsiniz." }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { type: "button", onClick: exportData, disabled: exporting, className: "btn-secondary inline-flex items-center gap-1", children: [_jsx(Download, { className: "w-4 h-4" }), " ", exporting ? "Hazırlanıyor…" : "Verilerimi indir"] }), _jsx(Link, { to: "/account/delete", className: "btn-secondary text-red-700 border-red-200", children: "Hesap silme talebi" }), _jsx(Link, { to: "/kvkk", className: "btn-secondary", children: "KVKK sayfas\u0131" })] })] })] }));
}
function Field({ label, value, onChange, placeholder }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: label }), _jsx("input", { value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, className: "mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" })] }));
}
