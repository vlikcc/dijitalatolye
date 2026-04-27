import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
export default class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error("[ErrorBoundary]", error, info);
        }
    }
    reset = () => this.setState({ error: null });
    render() {
        if (this.state.error) {
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-accent-50", children: _jsxs("div", { className: "max-w-md w-full rounded-2xl bg-white border border-rose-200 shadow-xl p-8 text-center", children: [_jsx("div", { className: "inline-flex w-12 h-12 rounded-xl bg-rose-100 text-rose-700 items-center justify-center mb-4", children: _jsx(AlertTriangle, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-xl font-extrabold text-slate-900", children: "Bir \u015Feyler ters gitti" }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Sayfa y\u00FCklenirken beklenmeyen bir hata olu\u015Ftu. Sayfay\u0131 yenileyebilir veya ana sayfaya d\u00F6nebilirsiniz." }), import.meta.env.DEV && (_jsx("pre", { className: "mt-4 text-left text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-48", children: this.state.error.message })), _jsxs("div", { className: "mt-6 flex gap-3 justify-center", children: [_jsxs("button", { onClick: this.reset, className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), " Tekrar dene"] }), _jsx("a", { href: "/", className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-brand-300", children: "Ana sayfa" })] })] }) }));
        }
        return this.props.children;
    }
}
