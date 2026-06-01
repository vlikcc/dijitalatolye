import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';

type ContentStatus =
  | 'Draft' | 'Submitted' | 'AIReviewing' | 'AIReviewed' | 'EditorReviewing'
  | 'Approved' | 'Rejected' | 'RevisionRequested' | 'AutoRejected'
  | 'Published' | 'Unpublished';

interface ContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  updatedAt: string;
  grade?: string;
  subject?: string;
}

@Component({
  selector: 'da-my-contents',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-extrabold text-ink">İçeriklerim</h1>
        <p class="text-sm text-muted mt-1">Yüklediğiniz tüm içeriklerin durumunu buradan takip edebilirsiniz.</p>
      </div>
      <a routerLink="/teacher/contents/new"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20">
        <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon> Yeni içerik
      </a>
    </header>

    @if (loading()) {
      <div class="rounded-2xl bg-surface border border-line/10 p-12 flex flex-col items-center text-dim">
        <mat-spinner diameter="24" color="primary"></mat-spinner>
        <p class="mt-3 text-sm">İçerikleriniz yükleniyor…</p>
      </div>
    } @else if (error()) {
      <div class="rounded-2xl bg-surface border border-rose-200 p-8 flex items-start gap-3">
        <mat-icon class="!text-rose-600 mt-0.5" style="font-size:20px;width:20px;height:20px">warning</mat-icon>
        <div>
          <p class="font-semibold text-ink">İçerikler yüklenemedi</p>
          <p class="text-sm text-muted mt-1">Bağlantınızı kontrol edip sayfayı yenileyin.</p>
        </div>
      </div>
    } @else if (items().length === 0) {
      <div class="rounded-2xl bg-surface border border-dashed border-brand-200 p-12 text-center">
        <div class="inline-flex w-12 h-12 rounded-xl bg-brand-50 text-brand-700 items-center justify-center">
          <mat-icon style="font-size:24px;width:24px;height:24px">description</mat-icon>
        </div>
        <h2 class="mt-4 font-semibold text-ink">Henüz içerik yüklemediniz</h2>
        <p class="mt-1 text-sm text-muted">İlk interaktif içeriğinizi 5 dakikada yayına hazırlayabilirsiniz.</p>
        <a routerLink="/teacher/contents/new"
          class="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700">
          <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon> İlk içeriği yükle
        </a>
      </div>
    } @else {
      <div class="rounded-2xl bg-surface border border-line/10 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-panel text-muted text-left">
            <tr>
              <th class="px-4 py-3 font-semibold">Başlık</th>
              <th class="px-4 py-3 font-semibold">Sınıf / Ders</th>
              <th class="px-4 py-3 font-semibold">Durum</th>
              <th class="px-4 py-3 font-semibold">Son güncelleme</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line/10">
            @for (c of items(); track c.id) {
              <tr class="hover:bg-brand-50/40">
                <td class="px-4 py-3 font-medium text-ink">{{ c.title }}</td>
                <td class="px-4 py-3 text-muted">{{ c.grade ?? '—' }} {{ c.subject ? '• ' + c.subject : '' }}</td>
                <td class="px-4 py-3">
                  <span [class]="badgeClass(c.status)">
                    <mat-icon style="font-size:14px;width:14px;height:14px">{{ badgeIcon(c.status) }}</mat-icon>
                    {{ badgeLabel(c.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-muted">{{ formatDate(c.updatedAt) }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex items-center gap-3">
                    @if (c.status === 'RevisionRequested') {
                      <button (click)="revise(c.id)" class="inline-flex items-center gap-1 text-amber-700 font-medium hover:text-amber-800">
                        <mat-icon style="font-size:14px;width:14px;height:14px">refresh</mat-icon> Revize et
                      </button>
                    }
                    <a [routerLink]="['/teacher/contents', c.id]" class="text-brand-700 font-medium hover:text-brand-800">Detay →</a>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class MyContentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly items = signal<ContentItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<ContentItem[]>('/contents/mine').subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  revise(id: string): void {
    this.api.post(`/contents/${id}/revise`, {}).subscribe({
      next: () => { this.load(); this.router.navigate(['/teacher/contents/new']); },
      error: () => undefined,
    });
  }

  badgeClass(s: ContentStatus): string {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ';
    switch (s) {
      case 'Draft': case 'Unpublished': return base + 'bg-panel text-muted';
      case 'Submitted': return base + 'bg-brand-50 text-brand-700';
      case 'AIReviewing': case 'AIReviewed': return base + 'bg-violet-50 text-violet-700';
      case 'EditorReviewing': case 'RevisionRequested': return base + 'bg-amber-50 text-amber-700';
      case 'Approved': case 'Published': return base + 'bg-emerald-50 text-emerald-700';
      case 'Rejected': case 'AutoRejected': return base + 'bg-rose-50 text-rose-700';
      default: return base + 'bg-panel text-muted';
    }
  }

  badgeLabel(s: ContentStatus): string {
    return {
      Draft: 'Taslak', Submitted: 'Gönderildi', AIReviewing: 'AI inceliyor', AIReviewed: 'AI tamamlandı',
      EditorReviewing: 'Editörde', Approved: 'Onaylandı', Published: 'Yayında', Rejected: 'Reddedildi',
      RevisionRequested: 'Revizyon istendi', AutoRejected: 'Otomatik reddedildi', Unpublished: 'Yayından kaldırıldı',
    }[s] ?? String(s);
  }

  badgeIcon(s: ContentStatus): string {
    if (['Approved', 'Published', 'AIReviewed'].includes(s)) return 'check_circle';
    if (['Rejected', 'AutoRejected'].includes(s)) return 'cancel';
    if (['RevisionRequested'].includes(s)) return 'warning';
    if (['AIReviewing', 'EditorReviewing', 'Submitted'].includes(s)) return 'schedule';
    return 'description';
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }
}
