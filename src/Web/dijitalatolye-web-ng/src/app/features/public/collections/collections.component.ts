import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAtUtc: string;
}

@Component({
  selector: 'da-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Koleksiyonlarım</h1>
        <button (click)="isCreating.set(true)"
          class="px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700">+ Yeni Koleksiyon</button>
      </div>

      @if (isCreating()) {
        <div class="mb-8 p-6 rounded-2xl bg-white border border-brand-200">
          <h2 class="text-xl font-semibold text-slate-900 mb-4">Yeni Koleksiyon Oluştur</h2>
          <div class="space-y-4">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Koleksiyon Adı</span>
              <input type="text" [(ngModel)]="newName" placeholder="Örn: 9. Sınıf Fizik Kaynakları"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Açıklama (Opsiyonel)</span>
              <textarea [(ngModel)]="newDesc" rows="3"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"></textarea>
            </label>
            <div class="flex gap-3">
              <button (click)="create()" [disabled]="!newName.trim() || creating()"
                class="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">
                {{ creating() ? 'Oluşturuluyor...' : 'Oluştur' }}
              </button>
              <button (click)="isCreating.set(false)" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">İptal</button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="text-center text-slate-500 py-12">Yükleniyor...</div>
      } @else if (collections().length === 0) {
        <div class="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-200">Henüz bir koleksiyonunuz yok.</div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (col of collections(); track col.id) {
            <div class="p-6 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 transition">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-semibold text-slate-900 line-clamp-1">{{ col.name }}</h3>
                <button (click)="remove(col.id)" class="text-slate-500 hover:text-rose-600 text-sm">Sil</button>
              </div>
              @if (col.description) {
                <p class="text-sm text-slate-600 line-clamp-2 mb-4">{{ col.description }}</p>
              }
              <div class="flex justify-between items-center text-xs text-slate-500 mt-4">
                <span>{{ col.itemCount }} içerik</span>
                <span>{{ formatDate(col.createdAtUtc) }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CollectionsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly collections = signal<Collection[]>([]);
  readonly loading = signal(true);
  readonly isCreating = signal(false);
  readonly creating = signal(false);
  newName = '';
  newDesc = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.get<Collection[]>('/users/me/collections').subscribe({
      next: (data) => { this.collections.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    if (!this.newName.trim()) return;
    this.creating.set(true);
    this.api.post('/users/me/collections', { name: this.newName, description: this.newDesc, isPublic: false }).subscribe({
      next: () => { this.isCreating.set(false); this.newName = ''; this.newDesc = ''; this.creating.set(false); this.load(); },
      error: () => this.creating.set(false),
    });
  }

  remove(id: string): void {
    if (!confirm('Bu koleksiyonu silmek istediğinize emin misiniz?')) return;
    this.api.delete(`/users/me/collections/${id}`).subscribe({ next: () => this.load() });
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleDateString('tr-TR'); }
}
