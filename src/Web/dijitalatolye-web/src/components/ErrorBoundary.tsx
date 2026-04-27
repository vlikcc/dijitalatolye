import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-accent-50">
          <div className="max-w-md w-full rounded-2xl bg-white border border-rose-200 shadow-xl p-8 text-center">
            <div className="inline-flex w-12 h-12 rounded-xl bg-rose-100 text-rose-700 items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Bir şeyler ters gitti</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sayfa yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenileyebilir veya ana sayfaya dönebilirsiniz.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-4 text-left text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-48">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={this.reset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700">
                <RotateCcw className="w-4 h-4" /> Tekrar dene
              </button>
              <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-brand-300">
                Ana sayfa
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
