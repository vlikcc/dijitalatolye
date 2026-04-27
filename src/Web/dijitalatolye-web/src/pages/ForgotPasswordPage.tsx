import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Bilgi sızdırmamak için her durumda başarı gösterilir
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Şifremi unuttum</h1>
          <p className="mt-1 text-sm text-slate-600">
            E-posta adresinizi girin; sıfırlama bağlantısını gönderelim.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> E-posta yolda
              </div>
              <p className="mt-1.5 text-emerald-700">
                Eğer <strong>{email}</strong> sistemimizde kayıtlıysa, sıfırlama bağlantısını dakikalar içinde alırsınız.
                Gelen kutusunu ve spam klasörünü kontrol edin.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">E-posta</span>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@meb.gov.tr"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
                </div>
              </label>

              {error && <p className="text-rose-700 text-sm">{error}</p>}

              <button disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-center text-slate-600">
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Girişe dön
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
