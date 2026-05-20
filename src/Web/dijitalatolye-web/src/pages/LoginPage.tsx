import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/state/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const registeredEmail = searchParams.get("email") ?? "";
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        roles?: string[];
      }>("/auth/login", { email, password });
      setTokens(data.accessToken, data.refreshToken);

      const roles = data.roles ?? rolesFromJwt(data.accessToken);
      setUser(email, roles);

      if (roles.some((r) => ["Admin", "SuperAdmin"].includes(r))) {
        navigate("/admin");
      } else if (roles.some((r) => ["Editor"].includes(r))) {
        navigate("/editor/queue");
      } else {
        navigate("/teacher/contents/new");
      }
    } catch (err: unknown) {
      const msg = extractApiError(err) ?? "Giriş başarısız. E-posta veya şifre hatalı olabilir.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tekrar hoş geldiniz</h1>
          <p className="mt-1 text-sm text-slate-600">Hesabınıza giriş yaparak içerik üretmeye devam edin.</p>

          {justRegistered && (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
              Kayıt tamamlandı. E-posta doğrulama bağlantısı gönderildi.{" "}
              <Link
                to={registeredEmail ? `/verify-email?email=${encodeURIComponent(registeredEmail)}` : "/verify-email"}
                className="font-semibold underline"
              >
                E-postayı doğrula
              </Link>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field icon={Mail} type="email" placeholder="ornek@meb.gov.tr" label="E-posta"
              value={email} onChange={setEmail} autoComplete="email" />
            <Field icon={Lock} type="password" placeholder="••••••••" label="Şifre"
              value={password} onChange={setPassword} autoComplete="current-password" />

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
                Beni hatırla
              </label>
              <Link to="/forgot-password" className="text-brand-700 hover:text-brand-800 font-medium">
                Şifremi unuttum
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-6">
            <a
              href={`${import.meta.env.VITE_API_BASE_URL ?? "/api"}/auth/google`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Google ile giriş yap
            </a>
          </div>

          <p className="mt-4 text-sm text-center text-slate-600">
            Hesabınız yok mu?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Ücretsiz kayıt olun
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

function rolesFromJwt(token: string): string[] {
  try {
    const payload = token.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
    const claim = json.role ?? json.roles ?? [];
    return Array.isArray(claim) ? claim : [claim];
  } catch {
    return [];
  }
}

function extractApiError(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "response" in err) {
    const r = (err as { response?: { data?: { detail?: string; title?: string; message?: string } } }).response;
    return r?.data?.detail ?? r?.data?.title ?? r?.data?.message ?? null;
  }
  return null;
}
