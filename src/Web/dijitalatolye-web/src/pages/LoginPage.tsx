import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/state/auth";

export default function LoginPage() {
  const navigate = useNavigate();
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
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login", { email, password }
      );
      setTokens(data.accessToken, data.refreshToken);
      const roles = rolesFromJwt(data.accessToken);
      setUser(email, roles);
      if (roles.some(r => ["Admin", "SuperAdmin"].includes(r))) {
        navigate("/admin");
      } else if (roles.includes("Editor")) {
        navigate("/editor/queue");
      } else {
        navigate("/teacher/contents/new");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
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

  return (
    <section className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Giriş Yap</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="email" placeholder="E-posta" value={email}
          onChange={(e) => setEmail(e.target.value)}
          required className="w-full px-3 py-2 border rounded" />
        <input type="password" placeholder="Şifre" value={password}
          onChange={(e) => setPassword(e.target.value)}
          required className="w-full px-3 py-2 border rounded" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading}
          className="w-full px-3 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60">
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </section>
  );
}
