import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';
import {
  formatContentGradeLevels, formatContentSubjects, type ContentDetail,
} from '@core/api/contracts';

type ContentStatus = ContentDetail['state'];

interface ContentStats {
  totals: { views: number; plays: number; completes: number; likes: number; favorites: number; shares: number; totalDurationSeconds: number };
  avgScore: number | null;
}

interface OutcomeStat {
  outcomeCode: string;
  completes: number;
  progresses: number;
  avgScore: number | null;
}

@Component({
  selector: 'da-teacher-content-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="rounded-2xl bg-surface border border-line/10 p-12 flex flex-col items-center text-dim">
        <mat-spinner diameter="24" color="primary"></mat-spinner>
        <p class="mt-3 text-sm">İçerik yükleniyor…</p>
      </div>
    } @else if (error() || !content()) {
      <div class="rounded-2xl bg-surface border border-rose-200 p-8">
        <p class="font-semibold text-ink">İçerik bulunamadı</p>
        <p class="text-sm text-muted mt-1">Bu içeriğe erişiminiz olmayabilir veya kayıt silinmiş olabilir.</p>
        <a routerLink="/teacher/contents" class="inline-block mt-4 text-sm font-medium text-brand-700 hover:text-brand-800">← İçeriklerime dön</a>
      </div>
    } @else {
      <div class="max-w-3xl">
        <a routerLink="/teacher/contents" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-6">
          <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> İçeriklerime dön
        </a>

        <header class="rounded-2xl bg-surface border border-line/10 p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-dim">İçerik detayı</p>
              <h1 class="text-2xl font-extrabold text-ink mt-1">{{ content()!.title }}</h1>
              <p class="text-sm text-muted mt-2">
                {{ formatContentSubjects(content()!.subjects) }}
                @if (content()!.gradeLevels?.length) { · {{ formatContentGradeLevels(content()!.gradeLevels) }} }
              </p>
            </div>
            <span [class]="statusClass(content()!.state)">{{ statusLabel(content()!.state) }}</span>
          </div>
          @if (content()!.description) {
            <p class="mt-4 text-muted leading-relaxed">{{ content()!.description }}</p>
          }
          @if (content()!.tags.length) {
            <div class="mt-4 flex flex-wrap gap-2">
              @for (t of content()!.tags; track t) {
                <span class="text-xs bg-brand-50 text-brand-800 rounded-full px-2.5 py-1 font-medium">{{ t }}</span>
              }
            </div>
          }
        </header>

        <section class="mt-6 rounded-2xl bg-surface border border-line/10 p-6 text-sm text-muted space-y-3">
          <div class="flex justify-between gap-4 py-1 border-b border-line/10"><span class="text-dim">Durum</span><span class="font-medium">{{ statusLabel(content()!.state) }}</span></div>
          <div class="flex justify-between gap-4 py-1 border-b border-line/10"><span class="text-dim">Oluşturulma</span><span class="font-medium">{{ formatDate(content()!.createdAtUtc) }}</span></div>
          <div class="flex justify-between gap-4 py-1"><span class="text-dim">Son güncelleme</span><span class="font-medium">{{ formatDate(content()!.updatedAtUtc) }}</span></div>
        </section>

        <section class="mt-6 rounded-2xl bg-surface border border-line/10 p-6">
          <h2 class="font-semibold text-ink inline-flex items-center gap-2 mb-4">
            <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">insights</mat-icon>
            İstatistikler
          </h2>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="rounded-xl bg-panel/60 border border-line/10 p-4">
              <p class="text-xs text-dim">Görüntülenme</p>
              <p class="text-2xl font-extrabold text-ink mt-1">{{ stats()?.totals?.views ?? 0 }}</p>
            </div>
            <div class="rounded-xl bg-panel/60 border border-line/10 p-4">
              <p class="text-xs text-dim">Oynanma</p>
              <p class="text-2xl font-extrabold text-ink mt-1">{{ stats()?.totals?.plays ?? 0 }}</p>
            </div>
            <div class="rounded-xl bg-panel/60 border border-line/10 p-4">
              <p class="text-xs text-dim">Tamamlanma</p>
              <p class="text-2xl font-extrabold text-ink mt-1">{{ stats()?.totals?.completes ?? 0 }}</p>
            </div>
            <div class="rounded-xl bg-panel/60 border border-line/10 p-4">
              <p class="text-xs text-dim">Ortalama skor</p>
              <p class="text-2xl font-extrabold text-ink mt-1">{{ stats()?.avgScore != null ? stats()!.avgScore : '—' }}</p>
            </div>
          </div>

          @if (outcomes().length) {
            <div class="mt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-dim mb-2">Kazanım kırılımı</p>
              <div class="rounded-xl border border-line/10 divide-y divide-line/10 overflow-hidden">
                @for (o of outcomes(); track o.outcomeCode) {
                  <div class="px-4 py-3 flex items-center justify-between gap-4 text-sm">
                    <span class="font-mono text-ink">{{ o.outcomeCode }}</span>
                    <div class="flex items-center gap-4 text-dim">
                      <span>{{ o.completes }} tamamlama</span>
                      @if (o.progresses) { <span>{{ o.progresses }} ilerleme</span> }
                      <span class="font-medium text-ink">{{ o.avgScore != null ? o.avgScore + ' puan' : '—' }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <p class="mt-4 text-sm text-dim">Henüz etkileşim verisi yok.</p>
          }
        </section>

        @if (content()!.state === 'AutoRejected') {
          <div class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <div class="flex items-start gap-2.5">
              <mat-icon class="!text-rose-600 mt-0.5" style="font-size:20px;width:20px;height:20px">gpp_bad</mat-icon>
              <div>
                <p class="text-sm font-semibold text-rose-800">İçerik otomatik olarak reddedildi</p>
                <p class="text-sm text-rose-700 mt-0.5">{{ content()!.autoRejectReason || 'Red gerekçesi sistem tarafından kaydedilmedi.' }}</p>
              </div>
            </div>
          </div>
        }

        @if (actionError()) {
          <div class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{{ actionError() }}</div>
        }

        <div class="mt-6 flex flex-wrap gap-3">
          @if (content()!.state === 'RevisionRequested' || content()!.state === 'AutoRejected') {
            <button type="button" (click)="revise()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700">
              <mat-icon style="font-size:16px;width:16px;height:16px">refresh</mat-icon> Revize et
            </button>
          }
          @if (canEdit()) {
            <a [routerLink]="['/teacher/contents', content()!.id, 'edit']"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold">
              <mat-icon style="font-size:16px;width:16px;height:16px">edit</mat-icon> Düzenle
            </a>
          }
          @if (content()!.state === 'Draft' || content()!.state === 'RevisionRequested' || content()!.state === 'AutoRejected') {
            <a routerLink="/teacher/contents/new"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 text-brand-800 font-semibold hover:bg-brand-50">
              Yeni yükleme
            </a>
          }
          @if (canDelete()) {
            <button type="button" (click)="remove()" [disabled]="busy()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50 disabled:opacity-50">
              <mat-icon style="font-size:16px;width:16px;height:16px">delete</mat-icon> Sil
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class TeacherContentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  readonly formatContentSubjects = formatContentSubjects;
  readonly formatContentGradeLevels = formatContentGradeLevels;

  readonly content = signal<(ContentDetail & { slug?: string | null; versions?: unknown[] }) | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly busy = signal(false);
  readonly stats = signal<ContentStats | null>(null);
  readonly outcomes = signal<OutcomeStat[]>([]);

  canEdit(): boolean {
    const s = this.content()?.state;
    return s === 'Draft' || s === 'RevisionRequested';
  }
  canDelete(): boolean {
    const s = this.content()?.state;
    return s === 'Draft' || s === 'RevisionRequested' || s === 'AutoRejected' || s === 'Rejected';
  }

  remove(): void {
    const c = this.content();
    if (!c) return;
    if (!confirm(`"${c.title}" içeriği silinsin mi? Bu işlem geri alınamaz.`)) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.api.delete(`/contents/${c.id}`).subscribe({
      next: () => this.router.navigate(['/teacher/contents']),
      error: () => { this.busy.set(false); this.actionError.set('Silme işlemi başarısız.'); },
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set(true); this.loading.set(false); return; }
    this.api.get<ContentDetail & { slug?: string | null; versions?: unknown[] }>(`/contents/${id}`).subscribe({
      next: (data) => { this.content.set(data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
    this.api.get<ContentStats>(`/analytics/contents/${id}/summary`).subscribe({ next: (d) => this.stats.set(d) });
    this.api.get<{ outcomes: OutcomeStat[] }>(`/analytics/contents/${id}/outcomes`).subscribe({ next: (d) => this.outcomes.set(d?.outcomes ?? []) });
  }

  revise(): void {
    const id = this.content()?.id;
    if (!id) return;
    this.actionError.set(null);
    this.api.post(`/contents/${id}/revise`, {}).subscribe({
      next: () => this.router.navigate(['/teacher/contents/new']),
      error: () => this.actionError.set('Revize işlemi başarısız.'),
    });
  }

  statusLabel(status: ContentStatus): string {
    const map: Record<string, string> = {
      Draft: 'Taslak', GuardScanning: 'Güvenlik taraması', Submitted: 'Gönderildi', AIReviewing: 'AI inceliyor', AIReviewed: 'AI tamamlandı',
      EditorReviewing: 'Editörde', Approved: 'Onaylandı', Published: 'Yayında', Rejected: 'Reddedildi',
      RevisionRequested: 'Revizyon istendi', AutoRejected: 'Otomatik reddedildi', Unpublished: 'Yayından kaldırıldı',
    };
    return map[status] ?? status;
  }

  statusClass(status: ContentStatus): string {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold border ';
    if (status === 'Published' || status === 'Approved') return base + 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Rejected' || status === 'AutoRejected') return base + 'bg-rose-50 text-rose-800 border-rose-200';
    if (status === 'RevisionRequested') return base + 'bg-amber-50 text-amber-800 border-amber-200';
    return base + 'bg-panel text-muted border-line/10';
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }
}
