import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const emailFromQuery = params.get("email") ?? "";
  const tokenFromQuery = params.get("token") ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [token, setToken] = useState(tokenFromQuery);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/verify-email", { email, token });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white shadow-lg p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">E-posta doğrulama</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kayıt sonrası e-postanıza gelen bağlantıdaki token ile hesabınızı doğrulayın.
        </p>

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              E-posta doğrulandı.{" "}
              <Link to="/login" className="font-semibold underline">Giriş yapın</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="font-semibold text-slate-700">E-posta</span>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-700">Doğrulama kodu</span>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200"
              />
            </label>
            {error && (
              <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Doğrula
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
