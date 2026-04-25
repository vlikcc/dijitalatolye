import { Link } from "react-router-dom";

export default function AdminAiConfigPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Konfigürasyon</h1>
        <Link to="/admin" className="text-sm text-brand-600 hover:underline">← Panele dön</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Aktif LLM Sağlayıcı</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Birincil</span>
              <span className="font-medium">DeepSeek Chat</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fallback</span>
              <span className="font-medium text-slate-400">Yapılandırılmadı</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Max Token</span>
              <span className="font-medium">2048</span>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Moderasyon Pipeline</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Statik Analiz</span>
              <span className="font-medium text-emerald-600">Aktif</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">LLM Değerlendirme</span>
              <span className="font-medium text-emerald-600">Aktif</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Screenshot Analizi</span>
              <span className="font-medium text-amber-600">V1.1 Planlandı</span>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-lg p-5 md:col-span-2">
          <h2 className="font-semibold mb-3">Prompt Şablonları</h2>
          <p className="text-sm text-slate-500">
            AI moderasyon prompt şablonları <code className="bg-slate-100 px-1 rounded">PromptTemplates.cs</code> içinde
            versiyon kontrolüyle yönetilmektedir. Yeni prompt versiyonu eklemek için backend'de güncelleme yapılmalıdır.
          </p>
        </section>
      </div>
    </div>
  );
}
