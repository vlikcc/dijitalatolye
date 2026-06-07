import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface OutcomeProgress {
  outcomeCode: string;
  completes: number;
  progresses: number;
  avgScore: number | null;
  lastActivityUtc: string;
}

interface ProgressTotals {
  playedContents: number;
  totalCompletes: number;
}

interface MyProgress {
  totals: ProgressTotals;
  overallAvgScore: number | null;
  outcomes: OutcomeProgress[];
}

@Component({
  selector: 'da-student-progress',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="p-8 text-dim">Yükleniyor...</div>
    } @else {
      <div class="max-w-5xl">
        <header class="mb-8">
          <h1 class="text-2xl font-extrabold text-ink">İlerlemem</h1>
          <p class="text-sm text-muted mt-1">Oynadığın içeriklerden kazanım bazlı ilerlemen.</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-surface rounded-2xl border border-line/10 p-6 flex items-center gap-5 shadow-sm">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-brand-50 text-brand-600">
              <mat-icon style="font-size:28px;width:28px;height:28px">sports_esports</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-dim">Oynanan içerik</p>
              <p class="text-3xl font-extrabold text-ink mt-1">{{ data()?.totals?.playedContents ?? 0 }}</p>
            </div>
          </div>
          <div class="bg-surface rounded-2xl border border-line/10 p-6 flex items-center gap-5 shadow-sm">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <mat-icon style="font-size:28px;width:28px;height:28px">check_circle</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-dim">Tamamlama</p>
              <p class="text-3xl font-extrabold text-ink mt-1">{{ data()?.totals?.totalCompletes ?? 0 }}</p>
            </div>
          </div>
          <div class="bg-surface rounded-2xl border border-line/10 p-6 flex items-center gap-5 shadow-sm">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <mat-icon style="font-size:28px;width:28px;height:28px">grade</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-dim">Ortalama skor</p>
              <p class="text-3xl font-extrabold text-ink mt-1">{{ data()?.overallAvgScore != null ? data()!.overallAvgScore : '—' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-line/10">
            <h2 class="font-semibold text-ink inline-flex items-center gap-2">
              <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">school</mat-icon>
              Kazanım bazlı ilerleme
            </h2>
          </div>
          @if (!data()?.outcomes?.length) {
            <div class="p-8 text-center text-dim">
              <p>Henüz kazanım verisi yok. Bir içerik oynadığında burada görünecek.</p>
            </div>
          } @else {
            <div class="divide-y divide-line/10">
              @for (o of data()!.outcomes; track o.outcomeCode) {
                <div class="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 class="font-semibold text-ink font-mono text-sm">{{ o.outcomeCode }}</h3>
                    <div class="text-xs text-dim mt-1 flex gap-2">
                      <span>{{ o.completes }} tamamlama</span>
                      @if (o.progresses) { <span>•</span><span>{{ o.progresses }} ilerleme</span> }
                      <span>•</span><span>{{ formatDate(o.lastActivityUtc) }}</span>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    {{ o.avgScore != null ? o.avgScore + ' puan' : '—' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class ProgressComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly data = signal<MyProgress | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.get<MyProgress>('/analytics/me/progress').subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
  }
}
