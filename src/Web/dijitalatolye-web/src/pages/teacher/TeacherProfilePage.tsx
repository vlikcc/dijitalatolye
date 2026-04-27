import { useState } from "react";
import { User, Mail, ShieldCheck, Save, Loader2 } from "lucide-react";
import { useAuthStore } from "@/state/auth";
import { api } from "@/lib/api";

export default function TeacherProfilePage() {
  const { email, roles } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/users/me", { displayName, schoolName: school, bio });
      setSaved(true);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2400);
    }
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Profil</h1>
        <p className="text-sm text-slate-600 mt-1">Hesap bilgileriniz ve öğretmen profiliniz.</p>
      </header>

      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-lg">
            {(email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {email}
            </p>
            <p className="mt-1 text-sm text-slate-500 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Roller: {roles.join(", ") || "—"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 inline-flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" /> Öğretmen Bilgileri
        </h2>

        <Field label="Görünen ad" value={displayName} onChange={setDisplayName} placeholder="Ayşe Yılmaz" />
        <Field label="Okul / Kurum" value={school} onChange={setSchool} placeholder="Örn. Atatürk İlkokulu" />

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Hakkında</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
            placeholder="Branş, deneyim, ilgi alanları…"
            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition resize-y" />
        </label>

        <div className="flex items-center justify-between pt-2">
          {saved && <span className="text-sm text-emerald-700">Kaydedildi ✓</span>}
          <button disabled={saving}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
    </label>
  );
}
