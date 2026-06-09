import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface StudentAssignment {
  id: string;
  contentTitle: string;
  contentSlug: string | null;
  title: string;
  instructions: string | null;
  dueAtUtc: string | null;
  status: string;
  completed: boolean;
  completedAtUtc: string | null;
  bestScore: number | null;
}

@Component({
  selector: 'da-student-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl">
      <header class="mb-8">
        <h1 class="text-2xl font-extrabold text-ink">Ödevlerim</h1>
        <p class="text-sm text-muted mt-1">Katılım koduyla ödeve katıl ve tamamla.</p>
      </header>

      <div class="bg-surface rounded-2xl border border-line/10 p-6 shadow-sm mb-8">
        <h2 class="font-semibold text-ink mb-3 inline-flex items-center gap-2">
          <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">login</mat-icon>
          Ödeve katıl
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <input type="text" [(ngModel)]="joinCode" name="code" maxlength="12" placeholder="Katılım kodu (örn. ABC123)"
            class="rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink font-mono uppercase w-56" />
          <button type="button" (click)="join()" [disabled]="!joinCode || joining()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold disabled:opacity-50">
            Katıl
          </button>
          @if (joinError()) { <span class="text-sm text-rose-700">{{ joinError() }}</span> }
          @if (joinOk()) { <span class="text-sm text-emerald-700">Katıldın!</span> }
        </div>
      </div>

      <div class="bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-line/10"><h2 class="font-semibold text-ink">Katıldığım ödevler</h2></div>
        @if (loading()) {
          <div class="p-8 text-dim">Yükleniyor…</div>
        } @else if (assignments().length === 0) {
          <div class="p-8 text-center text-dim"><p>Henüz bir ödeve katılmadın.</p></div>
        } @else {
          <div class="divide-y divide-line/10">
            @for (a of assignments(); track a.id) {
              <div class="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <h3 class="font-semibold text-ink">{{ a.title }}</h3>
                  <div class="text-xs text-dim mt-1 flex gap-2">
                    @if (a.dueAtUtc) { <span>Son: {{ formatDate(a.dueAtUtc) }}</span> }
                    @if (a.instructions) { <span>•</span><span>{{ a.instructions }}</span> }
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  @if (a.completed) {
                    <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Tamamlandı{{ a.bestScore != null ? ' · ' + a.bestScore : '' }}
                    </span>
                  } @else if (a.contentSlug) {
                    <a [routerLink]="['/play', a.contentSlug]"
                      class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg da-grad text-white text-sm font-semibold">
                      <mat-icon style="font-size:16px;width:16px;height:16px">play_arrow</mat-icon> Başla
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class StudentAssignmentsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly assignments = signal<StudentAssignment[]>([]);
  readonly loading = signal(true);
  readonly joining = signal(false);
  readonly joinError = signal<string | null>(null);
  readonly joinOk = signal(false);

  joinCode = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.api.get<StudentAssignment[]>('/assignments/me').subscribe({
      next: (data) => { this.assignments.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  join(): void {
    const code = this.joinCode.trim().toUpperCase();
    if (!code) return;
    this.joining.set(true);
    this.joinError.set(null);
    this.joinOk.set(false);
    this.api.post('/assignments/join', { joinCode: code }).subscribe({
      next: () => { this.joining.set(false); this.joinOk.set(true); this.joinCode = ''; this.load(); },
      error: () => { this.joining.set(false); this.joinError.set('Geçersiz veya kapalı kod.'); },
    });
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
  }
}
