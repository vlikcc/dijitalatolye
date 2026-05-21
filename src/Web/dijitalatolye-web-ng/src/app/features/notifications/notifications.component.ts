import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/api/api.service';

interface Notification {
  id: string;
  title: string;
  body: string;
  url?: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'da-notifications',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <h1 class="text-2xl font-semibold mb-4 text-slate-900">Bildirimler</h1>
      @if (loading()) { <p>Yükleniyor…</p> }
      @if (!loading() && items().length === 0) { <p class="text-slate-500">Bildirim yok.</p> }
      <ul class="space-y-2">
        @for (n of items(); track n.id) {
          <li [class]="n.isRead ? 'p-4 border border-slate-200 rounded bg-white' : 'p-4 border border-brand-200 rounded bg-brand-50'">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium">{{ n.title }}</p>
                <p class="text-sm text-slate-600 mt-1">{{ n.body }}</p>
                @if (n.url) {
                  <a [href]="n.url" class="text-brand-700 hover:text-brand-800 text-sm mt-2 inline-block">Aç →</a>
                }
              </div>
              <div class="flex flex-col items-end gap-2 ml-3">
                <span class="text-xs text-slate-400">{{ formatDate(n.createdAt) }}</span>
                @if (!n.isRead) {
                  <button (click)="markRead(n.id)" class="text-xs text-brand-700 hover:text-brand-800">Okundu işaretle</button>
                }
              </div>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);

  readonly items = signal<Notification[]>([]);
  readonly loading = signal(true);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();
    this.timer = setInterval(() => this.load(), 15_000);
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private load(): void {
    this.loading.set(true);
    this.api.get<Notification[]>('/notifications').subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string): void {
    this.api.post(`/notifications/${id}/read`, {}).subscribe({
      next: () => this.items.set(this.items().map((n) => (n.id === id ? { ...n, isRead: true } : n))),
    });
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleString('tr-TR'); }
}
