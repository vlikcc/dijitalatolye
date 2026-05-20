import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';

interface AiConfig {
  primaryProvider: string;
  fallbackProvider?: string | null;
  model: string;
  maxTokens: number;
  promptVersion: string;
  staticAnalysisEnabled: boolean;
  llmEnabled: boolean;
  dailyCostLimitUsd: number;
}

export default function AdminAiConfigPage() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<AiConfig>('/admin/ai-config')
      .then(({ data }) => setConfig(data))
      .catch(() => setConfig({
        primaryProvider: 'DeepSeek',
        model: 'deepseek-chat',
        maxTokens: 2048,
        promptVersion: 'v2',
        staticAnalysisEnabled: true,
        llmEnabled: true,
        dailyCostLimitUsd: 50,
      }));
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.put<AiConfig>('/admin/ai-config', config);
      setConfig(data);
      setMessage('Kaydedildi.');
    } catch {
      setMessage('Kaydetme başarısız.');
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <p>Yükleniyor…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Konfigürasyon</h1>
        <Link to="/admin" className="text-sm text-brand-600 hover:underline">← Panele dön</Link>
      </div>

      <div className="bg-white border rounded-lg p-5 space-y-4 max-w-xl">
        <Field label="Birincil sağlayıcı" value={config.primaryProvider} onChange={(v) => setConfig({ ...config, primaryProvider: v })} />
        <Field label="Fallback sağlayıcı" value={config.fallbackProvider ?? ''} onChange={(v) => setConfig({ ...config, fallbackProvider: v || null })} />
        <Field label="Model" value={config.model} onChange={(v) => setConfig({ ...config, model: v })} />
        <Field label="Max token" value={String(config.maxTokens)} onChange={(v) => setConfig({ ...config, maxTokens: Number(v) || 2048 })} />
        <Field label="Prompt versiyonu" value={config.promptVersion} onChange={(v) => setConfig({ ...config, promptVersion: v })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.staticAnalysisEnabled} onChange={(e) => setConfig({ ...config, staticAnalysisEnabled: e.target.checked })} />
          Statik analiz aktif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.llmEnabled} onChange={(e) => setConfig({ ...config, llmEnabled: e.target.checked })} />
          LLM değerlendirme aktif
        </label>
        <Field label="Günlük maliyet limiti (USD)" value={String(config.dailyCostLimitUsd)} onChange={(v) => setConfig({ ...config, dailyCostLimitUsd: Number(v) || 0 })} />

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          {message && <span className="text-sm text-emerald-700">{message}</span>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input className="input mt-1 w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
