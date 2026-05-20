import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
export default function AdminAiConfigPage() {
    const [config, setConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    useEffect(() => {
        api.get('/admin/ai-config')
            .then(({ data }) => setConfig(data))
            .catch(() => setConfig({
            primaryProvider: 'DeepSeek',
            model: 'deepseek-chat',
            maxTokens: 2048,
            promptVersion: 'v2',
            staticAnalysisEnabled: true,
            llmEnabled: true,
            dailyCostLimitUsd: 50,
        }));
    }, []);
    async function save() {
        if (!config)
            return;
        setSaving(true);
        setMessage(null);
        try {
            const { data } = await api.put('/admin/ai-config', config);
            setConfig(data);
            setMessage('Kaydedildi.');
        }
        catch {
            setMessage('Kaydetme başarısız.');
        }
        finally {
            setSaving(false);
        }
    }
    if (!config)
        return _jsx("p", { children: "Y\u00FCkleniyor\u2026" });
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "AI Konfig\u00FCrasyon" }), _jsx(Link, { to: "/admin", className: "text-sm text-brand-600 hover:underline", children: "\u2190 Panele d\u00F6n" })] }), _jsxs("div", { className: "bg-white border rounded-lg p-5 space-y-4 max-w-xl", children: [_jsx(Field, { label: "Birincil sa\u011Flay\u0131c\u0131", value: config.primaryProvider, onChange: (v) => setConfig({ ...config, primaryProvider: v }) }), _jsx(Field, { label: "Fallback sa\u011Flay\u0131c\u0131", value: config.fallbackProvider ?? '', onChange: (v) => setConfig({ ...config, fallbackProvider: v || null }) }), _jsx(Field, { label: "Model", value: config.model, onChange: (v) => setConfig({ ...config, model: v }) }), _jsx(Field, { label: "Max token", value: String(config.maxTokens), onChange: (v) => setConfig({ ...config, maxTokens: Number(v) || 2048 }) }), _jsx(Field, { label: "Prompt versiyonu", value: config.promptVersion, onChange: (v) => setConfig({ ...config, promptVersion: v }) }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: config.staticAnalysisEnabled, onChange: (e) => setConfig({ ...config, staticAnalysisEnabled: e.target.checked }) }), "Statik analiz aktif"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: config.llmEnabled, onChange: (e) => setConfig({ ...config, llmEnabled: e.target.checked }) }), "LLM de\u011Ferlendirme aktif"] }), _jsx(Field, { label: "G\u00FCnl\u00FCk maliyet limiti (USD)", value: String(config.dailyCostLimitUsd), onChange: (v) => setConfig({ ...config, dailyCostLimitUsd: Number(v) || 0 }) }), _jsxs("div", { className: "flex items-center gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: save, disabled: saving, className: "btn-primary", children: saving ? 'Kaydediliyor…' : 'Kaydet' }), message && _jsx("span", { className: "text-sm text-emerald-700", children: message })] })] })] }));
}
function Field({ label, value, onChange }) {
    return (_jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "font-medium text-slate-700", children: label }), _jsx("input", { className: "input mt-1 w-full", value: value, onChange: (e) => onChange(e.target.value) })] }));
}
