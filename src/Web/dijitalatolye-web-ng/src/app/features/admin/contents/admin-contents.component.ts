import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api/api.service';

interface ContentItem { id: string; title: string; state: string; authorEmail?: string; createdAtUtc: string; }

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
                <th class="px-4 py-3 font-medium">Durum</th>
                <th class="px-4 py-3 font-medium">Yazar</th>
                <th class="px-4 py-3 font-medium">Oluşturulma</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/10">
              @for (item of items(); track item.id) {
                <tr class="hover:bg-panel">
                  <td class="px-4 py-3 font-medium">{{ item.title }}</td>
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

  ngOnInit(): void {
    this.api.get<{ items: ContentItem[] }>('/contents/all', { pageSize: 50 }).subscribe({
      next: (data) => { this.items.set(data.items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  badgeClass(state: string): string {
    const map: Record<string, string> = {
      Draft: 'bg-panel text-muted',
      Submitted: 'bg-amber-100 text-amber-700',
      InReview: 'bg-blue-100 text-blue-700',
      Published: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-rose-100 text-rose-700',
    };
    return 'px-2 py-0.5 rounded text-xs font-medium ' + (map[state] ?? 'bg-panel');
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleDateString('tr-TR'); }
}
