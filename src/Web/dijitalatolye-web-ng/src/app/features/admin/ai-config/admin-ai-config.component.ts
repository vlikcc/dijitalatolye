import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'da-admin-ai-config',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-ink">AI Konfigürasyon</h1>
        <a routerLink="/admin" class="text-sm text-brand-600 hover:underline">← Panele dön</a>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <section class="bg-surface border border-line/10 rounded-lg p-5">
          <h2 class="font-semibold mb-3">Aktif LLM Sağlayıcı</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-muted">Birincil</span><span class="font-medium">DeepSeek Chat</span></div>
            <div class="flex justify-between"><span class="text-muted">Fallback</span><span class="font-medium text-dim">Yapılandırılmadı</span></div>
            <div class="flex justify-between"><span class="text-muted">Max Token</span><span class="font-medium">2048</span></div>
          </div>
        </section>

        <section class="bg-surface border border-line/10 rounded-lg p-5">
          <h2 class="font-semibold mb-3">Moderasyon Pipeline</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-muted">Statik Analiz</span><span class="font-medium text-emerald-600">Aktif</span></div>
            <div class="flex justify-between"><span class="text-muted">LLM Değerlendirme</span><span class="font-medium text-emerald-600">Aktif</span></div>
            <div class="flex justify-between"><span class="text-muted">AI Metadata Extract</span><span class="font-medium text-emerald-600">Aktif</span></div>
            <div class="flex justify-between"><span class="text-muted">Screenshot Analizi</span><span class="font-medium text-amber-600">V1.1 Planlandı</span></div>
          </div>
        </section>

        <section class="bg-surface border border-line/10 rounded-lg p-5 md:col-span-2">
          <h2 class="font-semibold mb-3">Prompt Şablonları</h2>
          <p class="text-sm text-dim">
            AI moderasyon ve metadata extraction prompt şablonları <code class="bg-panel px-1 rounded">PromptTemplates.cs</code> ve
            <code class="bg-panel px-1 rounded">DeepSeekMetadataExtractor.cs</code> içinde versiyon kontrolüyle yönetilmektedir.
          </p>
        </section>
      </div>
    </div>
  `,
})
export class AdminAiConfigComponent {}
