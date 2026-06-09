import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { ApiService } from '@core/api/api.service';
import {
  CatalogOutcome, CatalogSubject, ContentDetail, formatContentGradeLevels, formatContentSubjects,
  UpdateMetadataRequest,
} from '@core/api/contracts';

@Component({
  selector: 'da-content-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <a [routerLink]="['/teacher/contents', contentId]" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-6">
        <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> İçeriğe dön
      </a>

      @if (loading()) {
        <div class="p-8 text-dim">Yükleniyor…</div>
      } @else if (loadError()) {
        <div class="rounded-2xl bg-surface border border-rose-200 p-8 text-ink">İçerik bulunamadı.</div>
      } @else if (!editable()) {
        <div class="rounded-2xl bg-surface border border-amber-200 p-6 text-ink">
          <p class="font-semibold">Bu içerik düzenlenemez.</p>
          <p class="text-sm text-muted mt-1">Yalnızca <b>Taslak</b> veya <b>Revizyon istendi</b> durumundaki içerikler düzenlenebilir.</p>
        </div>
      } @else {
        <header class="mb-6">
          <h1 class="text-2xl font-extrabold text-ink">İçeriği düzenle</h1>
          <p class="text-sm text-muted mt-1">Metadata alanlarını güncelleyip kaydedin. Birden fazla ders ve sınıf seviyesi seçebilirsiniz.</p>
        </header>

        <div class="bg-surface border border-line/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-muted">Başlık</label>
            <input type="text" [(ngModel)]="title" maxlength="200"
              class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg focus:border-brand-400 outline-none" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-muted">Açıklama</label>
            <textarea [(ngModel)]="description" rows="3" maxlength="2000"
              class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg focus:border-brand-400 outline-none resize-y"></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted">Dersler</label>
            <div class="flex flex-wrap gap-2">
              @for (s of availableSubjects(); track s) {
                <button type="button" (click)="toggleSubject(s)"
                  [class]="selectedSubjects().includes(s)
                    ? 'px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-400 bg-brand-50 text-brand-800'
                    : 'px-3 py-1.5 rounded-lg text-sm font-medium border border-line/15 bg-bg text-muted hover:border-brand-300'">
                  {{ s }}
                </button>
              }
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted">Sınıf seviyeleri</label>
            <div class="flex flex-wrap gap-2">
              @for (g of grades; track g) {
                <button type="button" (click)="toggleGradeLevel(g)"
                  [class]="selectedGradeLevels().includes(g)
                    ? 'px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-400 bg-brand-50 text-brand-800'
                    : 'px-3 py-1.5 rounded-lg text-sm font-medium border border-line/15 bg-bg text-muted hover:border-brand-300'">
                  {{ g }}. Sınıf
                </button>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted">Zorluk</label>
              <select [(ngModel)]="difficulty"
                class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg outline-none">
                <option value="Easy">Kolay</option>
                <option value="Medium">Orta</option>
                <option value="Hard">Zor</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted">Süre (dakika)</label>
              <input type="number" min="1" max="120" [(ngModel)]="durationMinutes"
                class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg outline-none" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-muted">Etiketler</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              @for (t of tags(); track t) {
                <span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-panel border border-line/15">
                  {{ t }}
                  <button type="button" (click)="removeTag(t)" class="text-dim hover:text-rose-600">
                    <mat-icon style="font-size:13px;width:13px;height:13px">close</mat-icon>
                  </button>
                </span>
              } @empty { <span class="text-xs text-dim">Etiket yok</span> }
            </div>
            <input type="text" [(ngModel)]="tagInput" (keydown.enter)="$event.preventDefault(); addTag()"
              placeholder="Etiket yazıp Enter'a basın"
              class="w-full px-3 py-2 rounded-lg border border-line/15 bg-bg outline-none text-sm" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-muted">Kazanım kodları</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              @for (c of outcomeCodes(); track c) {
                <span class="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded bg-brand-50 text-brand-800 border border-brand-200">
                  {{ c }}
                  <button type="button" (click)="removeOutcome(c)" class="text-dim hover:text-rose-600">
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
                    <div class="p-3 text-xs text-dim">Seçilen ders/sınıf kombinasyonları için kazanım bulunamadı.</div>
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

          @if (saveError()) {
            <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{{ saveError() }}</div>
          }

          <div class="flex gap-3 pt-2">
            <button type="button" (click)="save()" [disabled]="saving() || !title.trim() || selectedSubjects().length === 0"
              class="px-5 py-2.5 rounded-xl da-grad text-white font-semibold disabled:opacity-50">
              Kaydet
            </button>
            <a [routerLink]="['/teacher/contents', contentId]"
              class="px-5 py-2.5 rounded-xl border border-line/15 text-muted font-semibold hover:bg-panel">İptal</a>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContentEditComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  contentId = '';
  readonly grades = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly state = signal<string>('');
  readonly editable = computed(() => this.state() === 'Draft' || this.state() === 'RevisionRequested');

  readonly availableSubjects = signal<string[]>(['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce']);
  readonly selectedSubjects = signal<string[]>([]);
  readonly selectedGradeLevels = signal<number[]>([]);
  readonly tags = signal<string[]>([]);
  readonly outcomeCodes = signal<string[]>([]);
  readonly catalogOutcomes = signal<CatalogOutcome[]>([]);
  readonly outcomesLoading = signal(false);
  readonly catalogOpen = signal(false);

  readonly canBrowseOutcomes = computed(() =>
    this.selectedSubjects().length > 0 && this.selectedGradeLevels().length > 0,
  );

  readonly catalogScopeLabel = computed(() =>
    `${formatContentSubjects(this.selectedSubjects())} · ${formatContentGradeLevels(this.selectedGradeLevels())}`,
  );

  title = '';
  description = '';
  difficulty = 'Medium';
  durationMinutes: number | null = null;
  tagInput = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loadError.set(true); this.loading.set(false); return; }
    this.contentId = id;

    this.api.get<CatalogSubject[]>('/catalog/subjects').subscribe({
      next: (list) => {
        const names = (list ?? []).map((s) => s.name).filter(Boolean);
        if (names.length) this.availableSubjects.set(names);
      },
    });

    this.api.get<ContentDetail>(`/contents/${id}`).subscribe({
      next: (c) => {
        this.state.set(c.state);
        this.title = c.title ?? '';
        this.description = c.description ?? '';
        this.selectedSubjects.set([...(c.subjects ?? [])]);
        this.selectedGradeLevels.set([...(c.gradeLevels ?? [])]);
        this.difficulty = c.difficulty || 'Medium';
        this.durationMinutes = c.durationMinutes ?? null;
        this.tags.set([...(c.tags ?? [])]);
        this.outcomeCodes.set([...(c.outcomeCodes ?? [])]);
        this.loading.set(false);
        if (this.canBrowseOutcomes()) this.loadCatalogOutcomes();
      },
      error: () => { this.loadError.set(true); this.loading.set(false); },
    });
  }

  toggleSubject(name: string): void {
    const cur = this.selectedSubjects();
    this.selectedSubjects.set(cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
    this.onSubjectGradeChange();
  }

  toggleGradeLevel(grade: number): void {
    const cur = this.selectedGradeLevels();
    this.selectedGradeLevels.set(cur.includes(grade) ? cur.filter((x) => x !== grade) : [...cur, grade].sort((a, b) => a - b));
    this.onSubjectGradeChange();
  }

  onSubjectGradeChange(): void {
    this.catalogOutcomes.set([]);
    this.catalogOpen.set(false);
    if (this.canBrowseOutcomes()) this.loadCatalogOutcomes();
  }

  private loadCatalogOutcomes(): void {
    const subjects = this.selectedSubjects();
    const grades = this.selectedGradeLevels();
    if (!subjects.length || !grades.length) return;

    this.outcomesLoading.set(true);
    const pairs = subjects.flatMap((subject) => grades.map((grade) => ({ subject, grade })));
    forkJoin(
      pairs.map((p) => this.api.get<CatalogOutcome[]>('/catalog/outcomes', { subject: p.subject, grade: p.grade, limit: 500 })),
    ).subscribe({
      next: (results) => {
        const map = new Map<string, CatalogOutcome>();
        for (const list of results) for (const o of list ?? []) map.set(o.code, o);
        this.catalogOutcomes.set(Array.from(map.values()));
        this.outcomesLoading.set(false);
      },
      error: () => {
        this.catalogOutcomes.set([]);
        this.outcomesLoading.set(false);
      },
    });
  }

  addTag(): void {
    const t = this.tagInput.trim();
    if (t && !this.tags().includes(t)) this.tags.set([...this.tags(), t]);
    this.tagInput = '';
  }
  removeTag(t: string): void { this.tags.set(this.tags().filter((x) => x !== t)); }

  toggleOutcome(code: string): void {
    this.outcomeCodes.set(this.outcomeCodes().includes(code)
      ? this.outcomeCodes().filter((x) => x !== code)
      : [...this.outcomeCodes(), code]);
  }
  removeOutcome(code: string): void { this.outcomeCodes.set(this.outcomeCodes().filter((x) => x !== code)); }

  save(): void {
    if (!this.title.trim() || this.selectedSubjects().length === 0) return;
    this.saving.set(true);
    this.saveError.set(null);
    const body: UpdateMetadataRequest = {
      title: this.title.trim(),
      description: this.description.trim() || null,
      subjects: this.selectedSubjects(),
      gradeLevels: this.selectedGradeLevels(),
      difficulty: this.difficulty,
      durationMinutes: this.durationMinutes,
      tags: this.tags(),
      outcomeCodes: this.outcomeCodes(),
    };
    this.api.put(`/contents/${this.contentId}/metadata`, body).subscribe({
      next: () => { this.saving.set(false); this.router.navigate(['/teacher/contents', this.contentId]); },
      error: (e) => {
        const msg = (e as { error?: { error?: string; detail?: string } })?.error;
        this.saveError.set(msg?.error ?? msg?.detail ?? 'Kaydetme başarısız.');
        this.saving.set(false);
      },
    });
  }
}
