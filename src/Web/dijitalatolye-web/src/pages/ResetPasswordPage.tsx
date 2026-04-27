import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, token, newPassword: password });
      navigate("/login?reset=1");
    } catch (err: unknown) {
      const r = (err as { response?: { data?: { detail?: string; title?: string } } }).response;
      setError(r?.data?.detail ?? r?.data?.title ?? "Sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Yeni şifre belirleyin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Hesap güvenliği için en az 8 karakterli, tahmin edilmesi zor bir şifre seçin.
          </p>

          {(!token || !email) && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Bağlantı eksik veya geçersiz. Lütfen e-postadaki sıfırlama bağlantısının tamamını kullanın.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <PasswordField label="Yeni şifre" value={password} onChange={setPassword} />
            <PasswordField label="Yeni şifre (tekrar)" value={confirm} onChange={setConfirm} />

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}

            <button disabled={loading || !token || !email}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Kaydediliyor..." : "Şifreyi değiştir"}
            </button>
          </form>

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

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="mt-1 relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="password" required minLength={8} value={value} onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password" placeholder="••••••••"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
      </div>
    </label>
  );
}
