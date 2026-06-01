import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <div class="da-eyebrow mb-2">[ Bildirimler ]</div>
      <h1 class="da-display text-2xl font-bold mb-5 text-ink">Bildirimler</h1>
      @if (loading()) { <p class="text-muted">Yükleniyor…</p> }
      @if (!loading() && items().length === 0) {
        <div class="text-center py-16 rounded-2xl border border-line/10 bg-surface">
          <mat-icon class="!text-dim" style="font-size:40px;width:40px;height:40px">notifications_off</mat-icon>
          <p class="mt-2 text-muted">Bildirim yok.</p>
        </div>
      }
      <ul class="space-y-3">
        @for (n of items(); track n.id) {
          <li [class]="n.isRead ? 'p-4 border border-line/10 rounded-2xl bg-surface' : 'p-4 border border-accent/30 rounded-2xl bg-accent/5'">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-display font-semibold text-ink">{{ n.title }}</p>
                <p class="text-sm text-muted mt-1">{{ n.body }}</p>
                @if (n.url) {
                  <a [href]="n.url" class="text-accent hover:text-brand-700 text-sm mt-2 inline-block font-medium">Aç →</a>
                }
              </div>
              <div class="flex flex-col items-end gap-2 ml-3">
                <span class="font-mono text-[11px] tracking-wider text-dim whitespace-nowrap">{{ formatDate(n.createdAt) }}</span>
                @if (!n.isRead) {
                  <button (click)="markRead(n.id)" class="text-xs text-accent hover:text-brand-700 font-medium">Okundu işaretle</button>
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
