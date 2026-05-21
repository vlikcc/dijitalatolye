import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/api/api.service';

@Component({
  selector: 'da-kvkk',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-2 text-slate-900">KVKK Haklarım</h1>
      <p class="text-slate-600 mb-6">
        6698 sayılı KVKK kapsamında kişisel verilerinize ilişkin haklarınızı buradan kullanabilirsiniz.
      </p>

      <section class="space-y-4">
        <div class="border border-slate-200 rounded-lg p-5 bg-white">
          <h2 class="font-semibold text-lg mb-1">Verilerimi İndir</h2>
          <p class="text-sm text-slate-600 mb-3">Profilinize ait kayıtlı verileri JSON olarak indirebilirsiniz.</p>
          <button class="px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-50 hover:bg-brand-700"
            (click)="handleExport()" [disabled]="busy() !== null">
            {{ busy() === 'export' ? 'Hazırlanıyor...' : 'İndir' }}
          </button>
        </div>

        <div class="border border-slate-200 rounded-lg p-5 bg-white">
          <h2 class="font-semibold text-lg mb-1">Profilimi Anonimleştir</h2>
          <p class="text-sm text-slate-600 mb-3">
            Ad, soyad, biyografi gibi kişisel alanlar anonimleştirilir. Yayınlanmış içerikleriniz ve etkileşim verileriniz için ayrı talep gereklidir.
          </p>
          <button class="px-4 py-2 bg-rose-600 text-white rounded disabled:opacity-50 hover:bg-rose-700"
            (click)="handleAnonymize()" [disabled]="busy() !== null">
            {{ busy() === 'anonymize' ? 'İşleniyor...' : 'Anonimleştir' }}
          </button>
        </div>
      </section>

      @if (message()) {
        <p class="mt-6 p-3 bg-emerald-50 text-emerald-800 rounded">{{ message() }}</p>
      }
    </div>
  `,
})
export class KvkkComponent {
  private readonly api = inject(ApiService);

  readonly busy = signal<'export' | 'anonymize' | null>(null);
  readonly message = signal<string | null>(null);

  handleExport(): void {
    this.busy.set('export');
    this.message.set(null);
    this.api.get<unknown>('/users/me/kvkk/export').subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `dijitalatolye-veri-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        this.message.set('Veri export tamamlandı.');
        this.busy.set(null);
      },
      error: () => { this.message.set('Export sırasında hata oluştu.'); this.busy.set(null); },
    });
  }

  handleAnonymize(): void {
    if (!confirm('Profil bilgileriniz anonimleştirilecek. Devam edilsin mi?')) return;
    this.busy.set('anonymize');
    this.message.set(null);
    this.api.post('/users/me/kvkk/anonymize', {}).subscribe({
      next: () => { this.message.set('Profiliniz anonimleştirildi.'); this.busy.set(null); },
      error: () => { this.message.set('İşlem sırasında hata oluştu.'); this.busy.set(null); },
    });
  }
}
