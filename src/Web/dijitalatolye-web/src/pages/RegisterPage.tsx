import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", displayName: "", password: "", role: "Teacher" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Kayıt Ol</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input placeholder="Görünen ad" value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          required className="w-full px-3 py-2 border rounded" />
        <input type="email" placeholder="E-posta" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required className="w-full px-3 py-2 border rounded" />
        <input type="password" placeholder="Şifre (min 8)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required minLength={8} className="w-full px-3 py-2 border rounded" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full px-3 py-2 border rounded">
          <option value="Teacher">Öğretmen</option>
          <option value="Student">Öğrenci</option>
        </select>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading}
          className="w-full px-3 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60">
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>
    </section>
  );
}
