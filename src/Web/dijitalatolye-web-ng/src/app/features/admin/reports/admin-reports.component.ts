import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface ReportsData {
  activeUsers: string;
  activeUsersDelta: string;
  publishedContents: string;
  publishedContentsDelta: string;
  totalPlays: string;
  totalPlaysDelta: string;
  aiApprovalRate: string;
  aiApprovalRateDelta: string;
  aiCostToday: string;
  aiCostTodayDelta: string;
  topTeachers: { name: string; contents: number }[];
}

@Component({
  selector: 'da-admin-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-ink">Raporlar & Metrikler</h1>
          <p class="text-sm text-muted mt-1">Platform sağlığı, kullanım istatistikleri ve içerik metrikleri.</p>
        </div>
        <select class="text-sm rounded-lg border border-line/10 px-3 py-2 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none">
          <option>Son 7 gün</option>
          <option>Son 30 gün</option>
          <option>Son 90 gün</option>
        </select>
      </header>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="rounded-2xl bg-surface border border-line/10 p-5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-brand-50 text-brand-700">
              <mat-icon style="font-size:20px;width:20px;height:20px">group</mat-icon>
            </div>
            <span class="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5">
              <mat-icon style="font-size:12px;width:12px;height:12px">north_east</mat-icon> {{ data()?.activeUsersDelta ?? '—' }}
            </span>
          </div>
          <div class="mt-3 text-2xl font-extrabold text-ink">{{ data()?.activeUsers ?? '—' }}</div>
          <div class="text-xs text-dim">Aktif kullanıcı</div>
        </div>
        <div class="rounded-2xl bg-surface border border-line/10 p-5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-accent-50 text-accent-600">
              <mat-icon style="font-size:20px;width:20px;height:20px">description</mat-icon>
            </div>
            <span class="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5">
              <mat-icon style="font-size:12px;width:12px;height:12px">north_east</mat-icon> {{ data()?.publishedContentsDelta ?? '—' }}
            </span>
          </div>
          <div class="mt-3 text-2xl font-extrabold text-ink">{{ data()?.publishedContents ?? '—' }}</div>
          <div class="text-xs text-dim">Yayınlanan içerik</div>
        </div>
        <div class="rounded-2xl bg-surface border border-line/10 p-5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-emerald-50 text-emerald-700">
              <mat-icon style="font-size:20px;width:20px;height:20px">visibility</mat-icon>
            </div>
            <span class="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5">
              <mat-icon style="font-size:12px;width:12px;height:12px">north_east</mat-icon> {{ data()?.totalPlaysDelta ?? '—' }}
            </span>
          </div>
          <div class="mt-3 text-2xl font-extrabold text-ink">{{ data()?.totalPlays ?? '—' }}</div>
          <div class="text-xs text-dim">Toplam oynatma</div>
        </div>
        <div class="rounded-2xl bg-surface border border-line/10 p-5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-violet-50 text-violet-700">
              <mat-icon style="font-size:20px;width:20px;height:20px">insights</mat-icon>
            </div>
            <span class="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5">
              <mat-icon style="font-size:12px;width:12px;height:12px">north_east</mat-icon> {{ data()?.aiApprovalRateDelta ?? '—' }}
            </span>
          </div>
          <div class="mt-3 text-2xl font-extrabold text-ink">{{ data()?.aiApprovalRate ?? '—' }}</div>
          <div class="text-xs text-dim">AI onay oranı</div>
        </div>
        <div class="rounded-2xl bg-surface border border-line/10 p-5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-amber-50 text-amber-700">
              <mat-icon style="font-size:20px;width:20px;height:20px">paid</mat-icon>
            </div>
            <span class="text-xs font-semibold text-dim inline-flex items-center gap-0.5">{{ data()?.aiCostTodayDelta ?? '—' }}</span>
          </div>
          <div class="mt-3 text-2xl font-extrabold text-ink">{{ data()?.aiCostToday ?? '—' }}</div>
          <div class="text-xs text-dim">AI maliyeti (bugün)</div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 rounded-2xl bg-surface border border-line/10 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-ink inline-flex items-center gap-2">
              <mat-icon class="!text-brand-600" style="font-size:16px;width:16px;height:16px">trending_up</mat-icon>
              İçerik üretim trendi
            </h2>
            <span class="text-xs text-dim">Son 30 gün</span>
          </div>
          <div class="h-64 rounded-xl da-dream-bg border border-line/15 flex items-center justify-center text-dim text-sm">
            Grafik verisi henüz bağlanmadı (Prometheus / Reports endpoint).
          </div>
        </div>

        <div class="rounded-2xl bg-surface border border-line/10 p-6">
          <h2 class="font-semibold text-ink mb-4">En aktif öğretmenler</h2>
          <ul class="space-y-3 text-sm">
            @for (t of data()?.topTeachers ?? []; track t.name; let i = $index) {
              <li class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">{{ i + 1 }}</div>
                  <span class="text-muted">{{ t.name }}</span>
                </div>
                <span class="text-xs text-dim">{{ t.contents }} içerik</span>
              </li>
            }
            @if (!data()) { <li class="text-sm text-dim">Yükleniyor...</li> }
          </ul>
        </div>
      </div>

      <div class="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <strong>Not:</strong> Bu sayfa raporlama backend'ine bağlanarak gösterilmektedir.
      </div>
    </div>
  `,
})
export class AdminReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly data = signal<ReportsData | null>(null);

  ngOnInit(): void {
    this.api.get<ReportsData>('/admin/reports').subscribe({ next: (d) => this.data.set(d) });
  }
}
