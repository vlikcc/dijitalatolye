import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, ShieldCheck, Save, Loader2, Download } from "lucide-react";
import { useAuthStore } from "@/state/auth";
import { api } from "@/lib/api";

interface NotificationPrefs {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  contentUpdates: boolean;
  marketingEmails: boolean;
}

export default function TeacherProfilePage() {
  const { email, roles } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailEnabled: true,
    inAppEnabled: true,
    contentUpdates: true,
    marketingEmails: false,
  });

  useEffect(() => {
    api.get<{ displayName?: string; schoolName?: string; bio?: string }>("/users/me")
      .then(({ data }) => {
        if (data.displayName) setDisplayName(data.displayName);
        if (data.schoolName) setSchool(data.schoolName);
        if (data.bio) setBio(data.bio ?? "");
      })
      .catch(() => {});
    api.get<NotificationPrefs>("/users/me/notification-preferences")
      .then(({ data }) => setPrefs(data))
      .catch(() => {});
  }, []);

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

  async function savePrefs() {
    await api.put("/users/me/notification-preferences", prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  async function exportData() {
    setExporting(true);
    try {
      const { data } = await api.get("/users/me/kvkk/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dijitalatolye-veri-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
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

      <form onSubmit={onSubmit} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 mb-6">
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

      <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3 mb-6">
        <h2 className="font-semibold text-slate-900">Bildirim Tercihleri</h2>
        {(["emailEnabled", "inAppEnabled", "contentUpdates", "marketingEmails"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
            />
            {key === "emailEnabled" && "E-posta bildirimleri"}
            {key === "inAppEnabled" && "Uygulama içi bildirimler"}
            {key === "contentUpdates" && "İçerik güncellemeleri"}
            {key === "marketingEmails" && "Pazarlama e-postaları"}
          </label>
        ))}
        <button type="button" onClick={savePrefs} className="btn-secondary text-sm">Tercihleri kaydet</button>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Verileriniz (KVKK)</h2>
        <p className="text-sm text-slate-600 mb-3">Profil verilerinizi JSON olarak indirebilir veya hesap silme talebinde bulunabilirsiniz.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportData} disabled={exporting} className="btn-secondary inline-flex items-center gap-1">
            <Download className="w-4 h-4" /> {exporting ? "Hazırlanıyor…" : "Verilerimi indir"}
          </button>
          <Link to="/account/delete" className="btn-secondary text-red-700 border-red-200">Hesap silme talebi</Link>
          <Link to="/kvkk" className="btn-secondary">KVKK sayfası</Link>
        </div>
      </section>
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
