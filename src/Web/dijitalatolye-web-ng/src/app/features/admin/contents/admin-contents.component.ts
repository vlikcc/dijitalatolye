import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api/api.service';
import { ContentType } from '@core/api/contracts';

interface ContentItem { id: string; title: string; type?: ContentType; state: string; authorEmail?: string; createdAtUtc: string; }

const TYPE_FILTERS: ReadonlyArray<{ value: ContentType | null; label: string }> = [
  { value: null, label: 'Tümü' },
  { value: 'Game', label: 'Oyun' },
  { value: 'DigitalContent', label: 'Dijital İçerik' },
  { value: 'EBook', label: 'e-Kitap' },
];

const TYPE_LABELS: Record<ContentType, string> = {
  Game: 'Oyun', DigitalContent: 'Dijital İçerik', EBook: 'e-Kitap',
};

@Component({
  selector: 'da-admin-contents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-ink">İçerik Yönetimi</h1>
        <a routerLink="/admin" class="text-sm text-brand-600 hover:underline">← Panele dön</a>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-5">
        @for (f of typeFilters; track f.label) {
          <button type="button" (click)="setTypeFilter(f.value)"
            [class]="f.value === typeFilter()
              ? 'px-3 py-1.5 rounded-full text-sm font-semibold da-grad text-white'
              : 'px-3 py-1.5 rounded-full text-sm font-medium bg-panel text-muted hover:text-ink'">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <p class="text-dim">Yükleniyor…</p>
      } @else if (items().length === 0) {
        <p class="text-dim">Henüz içerik bulunmuyor.</p>
      } @else {
        <div class="bg-surface border border-line/10 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-panel text-left">
              <tr>
                <th class="px-4 py-3 font-medium">Başlık</th>
                <th class="px-4 py-3 font-medium">Tür</th>
                <th class="px-4 py-3 font-medium">Durum</th>
                <th class="px-4 py-3 font-medium">Yazar</th>
                <th class="px-4 py-3 font-medium">Oluşturulma</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/10">
              @for (item of items(); track item.id) {
                <tr class="hover:bg-panel">
                  <td class="px-4 py-3 font-medium">{{ item.title }}</td>
                  <td class="px-4 py-3 text-muted">{{ typeLabel(item.type) }}</td>
                  <td class="px-4 py-3">
                    <span [class]="badgeClass(item.state)">{{ item.state }}</span>
                  </td>
                  <td class="px-4 py-3 text-muted">{{ item.authorEmail ?? '—' }}</td>
                  <td class="px-4 py-3 text-dim">{{ formatDate(item.createdAtUtc) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminContentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly items = signal<ContentItem[]>([]);
  readonly loading = signal(true);
  readonly typeFilter = signal<ContentType | null>(null);
  readonly typeFilters = TYPE_FILTERS;

  ngOnInit(): void { this.load(); }

  setTypeFilter(value: ContentType | null): void {
    if (this.typeFilter() === value) return;
    this.typeFilter.set(value);
    this.load();
  }

  typeLabel(t?: ContentType): string { return t ? TYPE_LABELS[t] : '—'; }

  private load(): void {
    this.loading.set(true);
    this.api.get<{ items: ContentItem[] }>('/contents/all', { pageSize: 50, type: this.typeFilter() || undefined }).subscribe({
      next: (data) => { this.items.set(data.items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  badgeClass(state: string): string {
    const map: Record<string, string> = {
      Draft: 'bg-panel text-muted',
      GuardScanning: 'bg-sky-100 text-sky-700',
      Submitted: 'bg-amber-100 text-amber-700',
      InReview: 'bg-blue-100 text-blue-700',
      Published: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-rose-100 text-rose-700',
    };
    return 'px-2 py-0.5 rounded text-xs font-medium ' + (map[state] ?? 'bg-panel');
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleDateString('tr-TR'); }
}
