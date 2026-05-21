import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';
import type { ContentDetail } from '@core/api/contracts';

type ContentStatus = ContentDetail['state'];

@Component({
  selector: 'da-teacher-content-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center text-slate-500">
        <mat-spinner diameter="24" color="primary"></mat-spinner>
        <p class="mt-3 text-sm">İçerik yükleniyor…</p>
      </div>
    } @else if (error() || !content()) {
      <div class="rounded-2xl bg-white border border-rose-200 p-8">
        <p class="font-semibold text-slate-900">İçerik bulunamadı</p>
        <p class="text-sm text-slate-600 mt-1">Bu içeriğe erişiminiz olmayabilir veya kayıt silinmiş olabilir.</p>
        <a routerLink="/teacher/contents" class="inline-block mt-4 text-sm font-medium text-brand-700 hover:text-brand-800">← İçeriklerime dön</a>
      </div>
    } @else {
      <div class="max-w-3xl">
        <a routerLink="/teacher/contents" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-6">
          <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> İçeriklerime dön
        </a>

        <header class="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">İçerik detayı</p>
              <h1 class="text-2xl font-extrabold text-slate-900 mt-1">{{ content()!.title }}</h1>
              <p class="text-sm text-slate-600 mt-2">
                {{ content()!.subject || '—' }}
                @if (content()!.gradeLevel) { · {{ content()!.gradeLevel }}. sınıf }
              </p>
            </div>
            <span [class]="statusClass(content()!.state)">{{ statusLabel(content()!.state) }}</span>
          </div>
          @if (content()!.description) {
            <p class="mt-4 text-slate-700 leading-relaxed">{{ content()!.description }}</p>
          }
          @if (content()!.tags.length) {
            <div class="mt-4 flex flex-wrap gap-2">
              @for (t of content()!.tags; track t) {
                <span class="text-xs bg-brand-50 text-brand-800 rounded-full px-2.5 py-1 font-medium">{{ t }}</span>
              }
            </div>
          }
        </header>

        <section class="mt-6 rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-700 space-y-3">
          <div class="flex justify-between gap-4 py-1 border-b border-slate-100"><span class="text-slate-500">Durum</span><span class="font-medium">{{ statusLabel(content()!.state) }}</span></div>
          <div class="flex justify-between gap-4 py-1 border-b border-slate-100"><span class="text-slate-500">Oluşturulma</span><span class="font-medium">{{ formatDate(content()!.createdAtUtc) }}</span></div>
          <div class="flex justify-between gap-4 py-1"><span class="text-slate-500">Son güncelleme</span><span class="font-medium">{{ formatDate(content()!.updatedAtUtc) }}</span></div>
        </section>

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
          @if (content()!.state === 'Draft' || content()!.state === 'RevisionRequested' || content()!.state === 'AutoRejected') {
            <a routerLink="/teacher/contents/new"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 text-brand-800 font-semibold hover:bg-brand-50">
              Yeni yükleme
            </a>
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

  readonly content = signal<(ContentDetail & { slug?: string | null; versions?: unknown[] }) | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set(true); this.loading.set(false); return; }
    this.api.get<ContentDetail & { slug?: string | null; versions?: unknown[] }>(`/contents/${id}`).subscribe({
      next: (data) => { this.content.set(data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
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
      Draft: 'Taslak', Submitted: 'Gönderildi', AIReviewing: 'AI inceliyor', AIReviewed: 'AI tamamlandı',
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
    return base + 'bg-slate-100 text-slate-700 border-slate-200';
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }
}
