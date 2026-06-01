import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface ReviewHistoryItem {
  id: string;
  title: string;
  decision: 'Approved' | 'Rejected' | 'RevisionRequested';
  comment?: string;
  decidedAtUtc: string;
}

@Component({
  selector: 'da-editor-history',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="p-8 text-dim">Yükleniyor...</div>
    } @else {
      <div class="max-w-4xl mx-auto">
        <header class="mb-6 flex items-center justify-between">
          <div>
            <a routerLink="/editor" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 mb-2">
              <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> Panele Dön
            </a>
            <h1 class="text-2xl font-extrabold text-ink">Karar Geçmişim</h1>
            <p class="text-sm text-muted mt-1">İnceleyip sonuçlandırdığınız tüm içeriklerin listesi.</p>
          </div>
        </header>

        <div class="bg-surface border border-line/10 rounded-2xl shadow-sm overflow-hidden">
          @if (items().length === 0) {
            <div class="p-8 text-center text-dim">
              <mat-icon class="!text-dim mb-3" style="font-size:48px;width:48px;height:48px">rule</mat-icon>
              <p>Henüz herhangi bir içeriği incelemediniz.</p>
            </div>
          } @else {
            <div class="divide-y divide-line/10">
              @for (item of items(); track item.id) {
                <div class="p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-panel transition">
                  <div>
                    <h3 class="font-semibold text-ink text-lg">{{ item.title }}</h3>
                    @if (item.comment) {
                      <p class="mt-1 text-sm text-muted border-l-2 border-line/10 pl-3 italic">"{{ item.comment }}"</p>
                    }
                    <p class="mt-2 text-xs text-dim inline-flex items-center gap-1.5">
                      <mat-icon style="font-size:14px;width:14px;height:14px">schedule</mat-icon>
                      {{ formatDate(item.decidedAtUtc) }}
                    </p>
                  </div>
                  <div class="shrink-0">
                    <span [class]="badgeClass(item.decision)">
                      <mat-icon style="font-size:16px;width:16px;height:16px">{{ badgeIcon(item.decision) }}</mat-icon>
                      {{ badgeLabel(item.decision) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class EditorHistoryComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly items = signal<ReviewHistoryItem[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.get<ReviewHistoryItem[]>('/review/history').subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  badgeClass(d: ReviewHistoryItem['decision']): string {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ';
    if (d === 'Approved') return base + 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (d === 'Rejected') return base + 'bg-rose-50 text-rose-700 border-rose-200';
    return base + 'bg-amber-50 text-amber-700 border-amber-200';
  }
  badgeLabel(d: ReviewHistoryItem['decision']): string {
    return d === 'Approved' ? 'Onaylandı' : d === 'Rejected' ? 'Reddedildi' : 'Revizyon İstendi';
  }
  badgeIcon(d: ReviewHistoryItem['decision']): string {
    return d === 'Approved' ? 'check_circle' : d === 'Rejected' ? 'cancel' : 'rule';
  }
  formatDate(iso: string): string { return new Date(iso).toLocaleString('tr-TR'); }
}
