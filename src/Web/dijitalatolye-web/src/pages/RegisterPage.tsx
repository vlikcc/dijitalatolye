import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", displayName: "", password: "", role: "Teacher" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordValid = form.password.length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/register", form);
      navigate("/login?registered=1");
    } catch (err: unknown) {
      const msg = extractApiError(err) ?? "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ücretsiz hesap oluşturun</h1>
          <p className="mt-1 text-sm text-slate-600">5 dakikada kayıt olun, ilk içeriğinizi yayına hazırlayın.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field icon={User} type="text" placeholder="Ayşe Yılmaz" label="Görünen ad"
              value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} autoComplete="name" />
            <Field icon={Mail} type="email" placeholder="ornek@meb.gov.tr" label="E-posta"
              value={form.email} onChange={(v) => setForm({ ...form, email: v })} autoComplete="email" />
            <div>
              <Field icon={Lock} type="password" placeholder="En az 8 karakter" label="Şifre"
                value={form.password} onChange={(v) => setForm({ ...form, password: v })} autoComplete="new-password" />
              {form.password.length > 0 && (
                <p className={`mt-1 text-xs inline-flex items-center gap-1 ${passwordValid ? "text-emerald-700" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> En az 8 karakter
                </p>
              )}
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Rol</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition">
                <option value="Teacher">Öğretmen</option>
                <option value="Student">Öğrenci</option>
              </select>
            </label>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Kayıt olarak{" "}
              <Link to="/kvkk" className="text-brand-700 hover:text-brand-800 underline">KVKK aydınlatma metnini</Link>{" "}
              okuduğunuzu kabul edersiniz.
            </p>

            <button disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-600">
            Zaten hesabınız var mı?{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function Field({
  icon: Icon, type, placeholder, label, value, onChange, autoComplete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type: string; placeholder: string; label: string;
  value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="mt-1 relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type={type} required value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
      </div>
    </label>
  );
}

function extractApiError(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "response" in err) {
    const r = (err as { response?: { data?: { detail?: string; title?: string; message?: string } } }).response;
    return r?.data?.detail ?? r?.data?.title ?? r?.data?.message ?? null;
  }
  return null;
}
