import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { ApiService } from '@core/api/api.service';
import { CatalogOutcome, CatalogSubject, formatContentGradeLevels, formatContentSubjects } from '@core/api/contracts';
import {
  StudioKeySource, StudioModelsResponse, StudioService, StudioSessionSummary, StudioTurnStatus, studioErrorMessage,
} from '@core/api/studio.service';

const STATUS_LABELS: Record<StudioTurnStatus, string> = {
  Queued: 'Sırada', Running: 'Üretiliyor', Succeeded: 'Hazır', Failed: 'Hata',
};

@Component({
  selector: 'da-studio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl">
      <header class="mb-6">
        <h1 class="text-2xl font-extrabold text-ink inline-flex items-center gap-2">
          <mat-icon class="!text-brand-600">auto_awesome</mat-icon> AI Oyun Stüdyosu
        </h1>
        <p class="text-sm text-muted mt-1">
          Oyun fikrinizi anlatın; EVREN yapay zekâ modelleri oyunu sizin için yazsın. Önizleyin, sohbetle geliştirin ve
          tek tıkla onaya gönderin. Gönderilen oyunlar diğer içerikler gibi güvenlik taraması ve editör onayından geçer.
        </p>
      </header>

      @if (keyNotice()) {
        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6 flex items-start gap-2">
          <mat-icon style="font-size:18px;width:18px;height:18px" class="mt-0.5">key</mat-icon>
          <span>
            Platform anahtarı henüz tanımlı değil. Oyun üretmek için
            <a routerLink="/teacher/profile" class="font-semibold underline">profilinizden kendi EVREN anahtarınızı</a> ekleyebilirsiniz.
          </span>
        </div>
      }

      <section class="rounded-2xl bg-surface border border-line/10 p-6 shadow-sm space-y-4 mb-8">
        <h2 class="font-semibold text-ink">Yeni oyun</h2>

        <div class="space-y-1">
          <label for="studio-title" class="text-xs font-semibold text-muted">Oyun adı</label>
          <input id="studio-title" type="text" [(ngModel)]="title" maxlength="200" placeholder="Örn. Kesir Avcısı"
            class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg focus:border-brand-400 outline-none" />
        </div>

        <div class="space-y-1">
          <label for="studio-idea" class="text-xs font-semibold text-muted">Oyun fikri</label>
          <textarea id="studio-idea" [(ngModel)]="idea" rows="5" maxlength="4000"
            placeholder="Örn. Ekrandan düşen kesirleri doğru sepete (1/2'den küçük / büyük) yönlendiren bir yakalama oyunu. 3 seviye, her seviyede hız artsın, yanlışta kısa açıklama göstersin."
            class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg focus:border-brand-400 outline-none resize-y"></textarea>
          <p class="text-xs text-dim">Oynanışı, kuralları, seviye/puan yapısını ve görsel tarzı ne kadar net anlatırsanız sonuç o kadar iyi olur.</p>
        </div>

        <div class="space-y-2">
          <span class="text-xs font-semibold text-muted">Dersler</span>
          <div class="flex flex-wrap gap-2">
            @for (s of availableSubjects(); track s) {
              <button type="button" (click)="toggleSubject(s)" [attr.aria-pressed]="selectedSubjects().includes(s)"
                [class]="chipClass(selectedSubjects().includes(s))">{{ s }}</button>
            }
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-xs font-semibold text-muted">Sınıf seviyeleri</span>
          <div class="flex flex-wrap gap-2">
            @for (g of grades; track g) {
              <button type="button" (click)="toggleGrade(g)" [attr.aria-pressed]="selectedGrades().includes(g)"
                [class]="chipClass(selectedGrades().includes(g))">{{ g }}. Sınıf</button>
            }
          </div>
        </div>

        <div class="space-y-1">
          <span class="text-xs font-semibold text-muted">Kazanımlar (isteğe bağlı)</span>
          <div class="flex flex-wrap gap-1.5 mb-2">
            @for (c of outcomeCodes(); track c) {
              <span class="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded bg-brand-50 text-brand-800 border border-brand-200">
                {{ c }}
                <button type="button" (click)="toggleOutcome(c)" class="text-dim hover:text-rose-600" [attr.aria-label]="c + ' kazanımını kaldır'">
                  <mat-icon style="font-size:13px;width:13px;height:13px">close</mat-icon>
                </button>
              </span>
            } @empty { <span class="text-xs text-dim">Kazanım seçilmedi</span> }
          </div>
          @if (!canBrowseOutcomes()) {
            <p class="text-xs text-dim">Katalogdan seçmek için en az bir ders ve bir sınıf seviyesi belirleyin.</p>
          } @else {
            <button type="button" (click)="catalogOpen.set(!catalogOpen())"
              class="text-xs px-3 py-1.5 rounded-lg border border-line/15 hover:bg-panel inline-flex items-center gap-1">
              <mat-icon style="font-size:14px;width:14px;height:14px">{{ catalogOpen() ? 'expand_less' : 'expand_more' }}</mat-icon>
              Katalogdan kazanım seç ({{ catalogScopeLabel() }})
            </button>
            @if (catalogOpen()) {
              <div class="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line/15 divide-y divide-line/10">
                @if (outcomesLoading()) {
                  <div class="p-3 text-xs text-dim">Kazanımlar yükleniyor…</div>
                } @else if (catalogOutcomes().length === 0) {
                  <div class="p-3 text-xs text-dim">Seçilen ders/sınıf için kazanım bulunamadı.</div>
                } @else {
                  @for (o of catalogOutcomes(); track o.code) {
                    <label class="flex items-start gap-2 p-2 hover:bg-panel cursor-pointer text-sm">
                      <input type="checkbox" class="mt-0.5" [checked]="outcomeCodes().includes(o.code)" (change)="toggleOutcome(o.code)" />
                      <span><span class="font-mono text-xs text-brand-700">{{ o.code }}</span> — {{ o.description }}</span>
                    </label>
                  }
                }
              </div>
            }
          }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label for="studio-model" class="text-xs font-semibold text-muted">Model</label>
            <select id="studio-model" [(ngModel)]="model" class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg outline-none">
              @for (m of meta()?.models ?? []; track m.id) {
                <option [value]="m.id">{{ m.label }}{{ m.description ? ' — ' + m.description : '' }}</option>
              }
            </select>
          </div>
          <fieldset class="space-y-1">
            <legend class="text-xs font-semibold text-muted">API anahtarı</legend>
            <div class="flex flex-col gap-1.5 text-sm pt-1">
              <label class="inline-flex items-center gap-2" [class.opacity-50]="!meta()?.platformKeyConfigured">
                <input type="radio" name="keySource" value="Platform" [(ngModel)]="keySource" [disabled]="!meta()?.platformKeyConfigured" />
                Platform anahtarı
                @if (meta()?.platformKeyConfigured) {
                  <span class="text-xs text-dim">(bugün {{ meta()!.usedToday }}/{{ meta()!.dailyLimit }})</span>
                }
              </label>
              <label class="inline-flex items-center gap-2" [class.opacity-50]="!meta()?.hasUserKey">
                <input type="radio" name="keySource" value="User" [(ngModel)]="keySource" [disabled]="!meta()?.hasUserKey" />
                Kendi anahtarım
                @if (meta()?.hasUserKey) {
                  <span class="text-xs text-dim font-mono">••••{{ meta()!.userKeyLast4 }}</span>
                } @else {
                  <a routerLink="/teacher/profile" class="text-xs text-brand-700 underline">ekle</a>
                }
              </label>
            </div>
          </fieldset>
        </div>

        @if (createError()) {
          <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{{ createError() }}</div>
        }

        <div class="flex justify-end">
          <button type="button" (click)="create()" [disabled]="!canCreate()"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20 disabled:opacity-50">
            @if (creating()) { <mat-spinner diameter="16"></mat-spinner> }
            @else { <mat-icon style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon> }
            Oyunu üret
          </button>
        </div>
      </section>

      <section>
        <h2 class="font-semibold text-ink mb-3">Stüdyo oturumlarım</h2>
        @if (loading()) {
          <div class="p-6 text-dim text-sm">Yükleniyor…</div>
        } @else if (sessions().length === 0) {
          <div class="rounded-2xl bg-surface border border-line/10 p-8 text-center text-dim text-sm">Henüz bir oyun üretmediniz.</div>
        } @else {
          <div class="rounded-2xl bg-surface border border-line/10 divide-y divide-line/10 overflow-hidden">
            @for (s of sessions(); track s.id) {
              <div class="px-5 py-4 flex items-center justify-between gap-4 hover:bg-panel transition">
                <a [routerLink]="['/teacher/studio', s.id]" class="min-w-0 flex-1">
                  <p class="font-semibold text-ink truncate">{{ s.title }}</p>
                  <p class="text-xs text-dim mt-1">
                    {{ s.turnCount }} sürüm · {{ s.model }} · {{ s.updatedAtUtc | date: 'd MMM y HH:mm' }}
                  </p>
                </a>
                <div class="flex items-center gap-3 shrink-0">
                  @if (s.contentId) {
                    <span class="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Gönderildi</span>
                  } @else if (s.latestStatus) {
                    <span [class]="statusClass(s.latestStatus)">{{ statusLabel(s.latestStatus) }}</span>
                  }
                  <button type="button" (click)="remove(s)" class="text-dim hover:text-rose-600" [attr.aria-label]="s.title + ' oturumunu sil'">
                    <mat-icon style="font-size:18px;width:18px;height:18px">delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class StudioListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly studio = inject(StudioService);
  private readonly router = inject(Router);

  readonly grades = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly loading = signal(true);
  readonly sessions = signal<StudioSessionSummary[]>([]);
  readonly meta = signal<StudioModelsResponse | null>(null);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);

  readonly availableSubjects = signal<string[]>(['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce']);
  readonly selectedSubjects = signal<string[]>([]);
  readonly selectedGrades = signal<number[]>([]);
  readonly outcomeCodes = signal<string[]>([]);
  readonly catalogOutcomes = signal<CatalogOutcome[]>([]);
  readonly outcomesLoading = signal(false);
  readonly catalogOpen = signal(false);

  title = '';
  idea = '';
  model = '';
  keySource: StudioKeySource = 'Platform';

  readonly keyNotice = computed(() => {
    const m = this.meta();
    return !!m && !m.platformKeyConfigured && !m.hasUserKey;
  });
  readonly canBrowseOutcomes = computed(() => this.selectedSubjects().length > 0 && this.selectedGrades().length > 0);
  readonly catalogScopeLabel = computed(() =>
    `${formatContentSubjects(this.selectedSubjects())} · ${formatContentGradeLevels(this.selectedGrades())}`);

  ngOnInit(): void {
    this.api.get<CatalogSubject[]>('/catalog/subjects').subscribe({
      next: (list) => {
        const names = (list ?? []).map((s) => s.name).filter(Boolean);
        if (names.length) this.availableSubjects.set(names);
      },
    });
    this.studio.models().subscribe({
      next: (m) => {
        this.meta.set(m);
        this.model = m.defaultModel;
        this.keySource = m.platformKeyConfigured ? 'Platform' : 'User';
      },
    });
    this.loadSessions();
  }

  canCreate(): boolean {
    const m = this.meta();
    const keyOk = this.keySource === 'Platform' ? !!m?.platformKeyConfigured : !!m?.hasUserKey;
    return !this.creating() && keyOk && !!this.model && this.title.trim().length > 0 && this.idea.trim().length >= 10;
  }

  create(): void {
    if (!this.canCreate()) return;
    this.creating.set(true);
    this.createError.set(null);
    this.studio.createSession({
      title: this.title.trim(),
      idea: this.idea.trim(),
      subjects: this.selectedSubjects(),
      gradeLevels: this.selectedGrades(),
      outcomeCodes: this.outcomeCodes(),
      model: this.model,
      keySource: this.keySource,
    }).subscribe({
      next: (s) => this.router.navigate(['/teacher/studio', s.id]),
      error: (e) => {
        this.createError.set(studioErrorMessage(e, 'Oyun üretimi başlatılamadı.'));
        this.creating.set(false);
      },
    });
  }

  remove(s: StudioSessionSummary): void {
    const note = s.contentId ? ' Gönderilmiş içerik etkilenmez.' : '';
    if (!confirm(`"${s.title}" stüdyo oturumu silinsin mi?${note}`)) return;
    this.studio.deleteSession(s.id).subscribe({
      next: () => this.sessions.set(this.sessions().filter((x) => x.id !== s.id)),
    });
  }

  toggleSubject(name: string): void {
    const cur = this.selectedSubjects();
    this.selectedSubjects.set(cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
    this.onScopeChange();
  }

  toggleGrade(grade: number): void {
    const cur = this.selectedGrades();
    this.selectedGrades.set(cur.includes(grade) ? cur.filter((x) => x !== grade) : [...cur, grade].sort((a, b) => a - b));
    this.onScopeChange();
  }

  toggleOutcome(code: string): void {
    const cur = this.outcomeCodes();
    this.outcomeCodes.set(cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code]);
  }

  chipClass(active: boolean): string {
    return active
      ? 'px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-400 bg-brand-50 text-brand-800'
      : 'px-3 py-1.5 rounded-lg text-sm font-medium border border-line/15 bg-bg text-muted hover:border-brand-300';
  }

  statusLabel(s: StudioTurnStatus): string { return STATUS_LABELS[s] ?? s; }

  statusClass(s: StudioTurnStatus): string {
    const base = 'text-xs px-2 py-1 rounded-full border ';
    switch (s) {
      case 'Succeeded': return base + 'bg-brand-50 text-brand-800 border-brand-200';
      case 'Failed': return base + 'bg-rose-50 text-rose-700 border-rose-200';
      default: return base + 'bg-amber-50 text-amber-800 border-amber-200';
    }
  }

  private loadSessions(): void {
    this.studio.sessions().subscribe({
      next: (list) => { this.sessions.set(list ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private onScopeChange(): void {
    this.catalogOutcomes.set([]);
    this.catalogOpen.set(false);
    const subjects = this.selectedSubjects();
    const grades = this.selectedGrades();
    if (!subjects.length || !grades.length) return;
    this.outcomesLoading.set(true);
    const pairs = subjects.flatMap((subject) => grades.map((grade) => ({ subject, grade })));
    forkJoin(pairs.map((p) => this.api.get<CatalogOutcome[]>('/catalog/outcomes', { subject: p.subject, grade: p.grade, limit: 500 })))
      .subscribe({
        next: (results) => {
          const map = new Map<string, CatalogOutcome>();
          for (const list of results) for (const o of list ?? []) map.set(o.code, o);
          this.catalogOutcomes.set(Array.from(map.values()));
          this.outcomesLoading.set(false);
        },
        error: () => { this.catalogOutcomes.set([]); this.outcomesLoading.set(false); },
      });
  }
}
