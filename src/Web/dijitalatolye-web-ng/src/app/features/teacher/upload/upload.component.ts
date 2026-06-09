import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { switchMap, timer, Subscription, forkJoin } from 'rxjs';
import { ApiService } from '@core/api/api.service';
import {
  AiExtractResponse, BundleUploadResponse, CatalogOutcome, CatalogSubject,
  ContentProcessingStatusResponse, ContentType, MetadataExtractResponse,
  UpdateMetadataRequest,
} from '@core/api/contracts';

type AiField = 'title' | 'description' | 'subjects' | 'gradeLevels' | 'durationMinutes' | 'difficulty' | 'tags' | 'outcomeCodes';

@Component({
  selector: 'da-teacher-upload',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatChipsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonToggleModule, MatSliderModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl font-extrabold text-ink">İçerik Yükle</h1>
        <p class="text-sm text-muted mt-1">
          ZIP veya HTML bundle'ınızı yükleyin. Önce güvenlik taraması (Guard), ardından AI metadata önerisi oluşturulur.
        </p>
      </header>

      <!-- İÇERİK TÜRÜ -->
      @if (phase() === 'idle') {
        <div class="mb-5">
          <label class="text-xs font-semibold text-muted mb-2 block">İçerik türü</label>
          <mat-button-toggle-group [value]="selectedType()" (change)="selectedType.set($event.value)" aria-label="İçerik türü">
            <mat-button-toggle value="Game">
              <mat-icon style="font-size:16px;width:16px;height:16px">sports_esports</mat-icon> Oyun
            </mat-button-toggle>
            <mat-button-toggle value="DigitalContent">
              <mat-icon style="font-size:16px;width:16px;height:16px">widgets</mat-icon> Dijital İçerik
            </mat-button-toggle>
            <mat-button-toggle value="EBook">
              <mat-icon style="font-size:16px;width:16px;height:16px">menu_book</mat-icon> e-Kitap
            </mat-button-toggle>
          </mat-button-toggle-group>
          <p class="text-xs text-dim mt-2">
            @if (selectedType() === 'DigitalContent') {
              Dijital içerik kazanım-tabanlıdır: göndermeden önce en az bir kazanım seçmeniz gerekir.
            } @else {
              Bu tür için kazanım seçimi opsiyoneldir.
            }
          </p>
        </div>
      }

      <!-- DROPZONE -->
      @if (phase() === 'idle' || phase() === 'uploading' || phase() === 'guardScanning' || phase() === 'extracting') {
        <div class="rounded-2xl border-2 border-dashed bg-surface p-12 text-center transition"
             [class.border-brand-400]="dragOver()"
             [class.bg-brand-50]="dragOver()"
             [class.border-line]="!dragOver()"
             (dragenter)="$event.preventDefault(); dragOver.set(true)"
             (dragover)="$event.preventDefault(); dragOver.set(true)"
             (dragleave)="dragOver.set(false)"
             (drop)="onDrop($event)">
          <div class="mx-auto inline-flex w-16 h-16 rounded-2xl da-grad text-white items-center justify-center mb-4 shadow-lg shadow-brand-700/20">
            <mat-icon style="font-size:32px;width:32px;height:32px">cloud_upload</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-ink">Dosyayı buraya bırakın</h2>
          <p class="text-sm text-muted mt-1">veya tıklayıp seçin. ZIP ya da tek HTML, en fazla 50 MB.</p>
          <button (click)="fileInput.click()" type="button"
            class="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20">
            <mat-icon style="font-size:16px;width:16px;height:16px">folder_open</mat-icon>
            Dosya seç
          </button>
          <input #fileInput type="file" hidden accept=".zip,.html,.htm" (change)="onFileSelected($event)" />

          @if (phase() === 'uploading') {
            <div class="mt-8 max-w-md mx-auto">
              <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
              <p class="mt-3 text-sm text-brand-700 font-medium inline-flex items-center gap-2">
                <mat-icon style="font-size:16px;width:16px;height:16px">cloud_upload</mat-icon>
                Dosya yükleniyor…
              </p>
            </div>
          }

          @if (phase() === 'guardScanning') {
            <div class="mt-8 max-w-md mx-auto">
              <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
              <p class="mt-3 text-sm text-brand-700 font-medium inline-flex items-center gap-2">
                <mat-icon style="font-size:16px;width:16px;height:16px">shield</mat-icon>
                Guard güvenlik taraması… (birkaç saniye sürebilir)
              </p>
            </div>
          }

          @if (phase() === 'extracting') {
            <div class="mt-8 max-w-md mx-auto">
              <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
              <p class="mt-3 text-sm text-brand-700 font-medium inline-flex items-center gap-2">
                <mat-icon style="font-size:16px;width:16px;height:16px">auto_awesome</mat-icon>
                Guard temiz — AI metadata önerisi hazırlanıyor…
              </p>
            </div>
          }

          @if (uploadError()) {
            <div class="mt-6 mx-auto max-w-md rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {{ uploadError() }}
            </div>
          }
        </div>
      }

      <!-- SUGGESTION FORM -->
      @if (phase() === 'form' && extraction()) {
        <div class="rounded-2xl bg-surface border border-line/10 p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">auto_awesome</mat-icon>
            <h2 class="font-semibold text-ink">AI Önerileri</h2>
            <span class="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
              Güven: {{ confidencePct() }}%
            </span>
          </div>
          <p class="text-xs text-dim mb-6">
            Aşağıdaki alanlar AI tarafından dolduruldu. İstediğiniz değişikliği yapın ve gönderin.
            Dosya zaten yüklendi (<code class="bg-panel px-1 rounded">{{ extraction()!.key }}</code>),
            tekrar yüklemeniz gerekmez.
          </p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Başlık -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Başlık <span [class]="badgeClass('title')">{{ badgeLabel('title') }}</span>
              </label>
              <input type="text" formControlName="title" (input)="markManual('title')"
                class="w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
            </div>

            <!-- Açıklama -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Açıklama <span [class]="badgeClass('description')">{{ badgeLabel('description') }}</span>
              </label>
              <textarea rows="3" formControlName="description" (input)="markManual('description')"
                class="w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none resize-y"></textarea>
            </div>

            <!-- Dersler (çoklu) -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Dersler <span [class]="badgeClass('subjects')">{{ badgeLabel('subjects') }}</span>
              </label>
              <div class="flex flex-wrap gap-2">
                @for (s of catalogSubjects(); track s) {
                  <button type="button" (click)="toggleSubject(s); markManual('subjects')"
                    [class]="selectedSubjects().includes(s)
                      ? 'px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-400 bg-brand-50 text-brand-800'
                      : 'px-3 py-1.5 rounded-lg text-sm font-medium border border-line/10 bg-surface text-muted hover:border-brand-300'">
                    {{ s }}
                  </button>
                }
              </div>
            </div>

            <!-- Sınıf seviyeleri (çoklu) -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Sınıf seviyeleri <span [class]="badgeClass('gradeLevels')">{{ badgeLabel('gradeLevels') }}</span>
              </label>
              <div class="flex flex-wrap gap-2">
                @for (g of grades; track g) {
                  <button type="button" (click)="toggleGradeLevel(g); markManual('gradeLevels')"
                    [class]="selectedGradeLevels().includes(g)
                      ? 'px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-400 bg-brand-50 text-brand-800'
                      : 'px-3 py-1.5 rounded-lg text-sm font-medium border border-line/10 bg-surface text-muted hover:border-brand-300'">
                    {{ g }}. Sınıf
                  </button>
                }
              </div>
            </div>

            <!-- Süre + Zorluk yan yana -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted flex items-center gap-2">
                  Tahmini süre (dk) <span [class]="badgeClass('durationMinutes')">{{ badgeLabel('durationMinutes') }}</span>
                </label>
                <input type="number" min="1" max="120" formControlName="durationMinutes" (input)="markManual('durationMinutes')"
                  class="w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted flex items-center gap-2">
                  Zorluk <span [class]="badgeClass('difficulty')">{{ badgeLabel('difficulty') }}</span>
                </label>
                <mat-button-toggle-group formControlName="difficulty" (change)="markManual('difficulty')" class="w-full">
                  <mat-button-toggle value="Easy">Kolay</mat-button-toggle>
                  <mat-button-toggle value="Medium">Orta</mat-button-toggle>
                  <mat-button-toggle value="Hard">Zor</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
            </div>

            <!-- Kazanım kodları -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Kazanım kodları (MEB) <span [class]="badgeClass('outcomeCodes')">{{ badgeLabel('outcomeCodes') }}</span>
              </label>

              @if (outcomeCodes().length === 0) {
                <p class="text-xs text-dim">Henüz kazanım seçilmedi. AI önerisi gelirse burada görünür; aşağıdaki listeden ekleyebilirsiniz.</p>
              } @else {
                <div class="flex flex-wrap gap-2">
                  @for (code of outcomeCodes(); track code) {
                    <span class="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-sm border"
                      [class.border-violet-200]="isAiSuggestedOutcome(code)"
                      [class.bg-violet-50]="isAiSuggestedOutcome(code)"
                      [class.border-line/15]="!isAiSuggestedOutcome(code)"
                      [class.bg-panel/60]="!isAiSuggestedOutcome(code)">
                      @if (isAiSuggestedOutcome(code)) {
                        <span class="text-[10px] font-semibold uppercase tracking-wide text-violet-700">AI</span>
                      }
                      <span class="font-semibold text-ink">{{ code }}</span>
                      @if (descOf(code)) {
                        <span class="text-dim hidden sm:inline">— {{ descOf(code) }}</span>
                      }
                      <button type="button" (click)="removeOutcome(code)"
                        class="p-0.5 rounded hover:bg-black/5 text-dim hover:text-ink" aria-label="Kaldır">
                        <mat-icon style="font-size:16px;width:16px;height:16px">close</mat-icon>
                      </button>
                    </span>
                  }
                </div>
              }

              @if (!canBrowseOutcomes()) {
                <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Katalog listesi için önce <strong>ders</strong> ve <strong>sınıf</strong> seçin.
                </p>
              } @else {
                <div class="rounded-lg border border-line/10 bg-panel/30 overflow-hidden">
                  <button type="button" (click)="toggleOutcomeCatalog()"
                    class="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-brand-50/60 transition">
                    <mat-icon class="!text-brand-600" style="font-size:18px;width:18px;height:18px">
                      {{ outcomeCatalogExpanded() ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                    <span class="flex-1 text-left">{{ outcomeCatalogTitle() }}</span>
                    @if (outcomesLoading()) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <span class="text-xs text-dim">{{ selectedCatalogCount() }}/{{ catalogOutcomes().length }} seçili</span>
                    }
                  </button>

                  @if (outcomeCatalogExpanded()) {
                    <div class="border-t border-line/10 max-h-64 overflow-y-auto">
                      @if (outcomesLoading()) {
                        <p class="text-xs text-dim px-3 py-3">Kazanımlar yükleniyor…</p>
                      } @else if (catalogOutcomes().length === 0) {
                        <p class="text-xs text-dim px-3 py-3">Bu ders ve sınıf için kazanım bulunamadı.</p>
                      } @else {
                        @for (o of catalogOutcomes(); track o.code) {
                          <label class="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-brand-50/50 border-b border-line/5 last:border-0">
                            <input type="checkbox" class="mt-0.5 rounded border-line/30 text-brand-600 focus:ring-brand-400"
                              [checked]="isOutcomeSelected(o.code)"
                              (change)="toggleOutcome(o)" />
                            <span class="text-sm leading-snug">
                              <span class="font-semibold text-ink">{{ o.code }}</span>
                              <span class="text-dim"> — {{ o.description }}</span>
                            </span>
                          </label>
                        }
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Etiketler -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Etiketler <span [class]="badgeClass('tags')">{{ badgeLabel('tags') }}</span>
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-chip-grid #tagGrid>
                  @for (t of tags(); track t) {
                    <mat-chip-row (removed)="removeTag(t)">
                      {{ t }}
                      <button matChipRemove><mat-icon>cancel</mat-icon></button>
                    </mat-chip-row>
                  }
                </mat-chip-grid>
                <input placeholder="Etiket ekleyin…"
                  [matChipInputFor]="tagGrid"
                  [matChipInputSeparatorKeyCodes]="separatorKeys"
                  (matChipInputTokenEnd)="addTag($event)" />
              </mat-form-field>
            </div>

            @if (submitError()) {
              <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ submitError() }}</div>
            }

            <div class="pt-2 flex gap-3 justify-end">
              <button type="button" (click)="reset()" class="px-4 py-2.5 rounded-xl border border-line/15 text-muted font-semibold hover:bg-panel">
                Vazgeç ve yeniden yükle
              </button>
              <button type="submit" [disabled]="submitting() || form.invalid"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20 disabled:opacity-60">
                @if (submitting()) { <mat-spinner diameter="16"></mat-spinner> }
                @else { <mat-icon style="font-size:16px;width:16px;height:16px">send</mat-icon> }
                Kaydet ve İncelemeye Gönder
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class UploadComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Dersler Catalog'tan yüklenir; yüklenene kadar (ve hata halinde) makul bir fallback gösterilir.
  readonly catalogSubjects = signal<string[]>(['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce']);
  readonly selectedSubjects = signal<string[]>([]);
  readonly selectedGradeLevels = signal<number[]>([]);
  readonly grades = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly separatorKeys = [ENTER, COMMA];

  readonly phase = signal<'idle' | 'uploading' | 'guardScanning' | 'extracting' | 'form'>('idle');
  readonly selectedType = signal<ContentType>('Game');
  readonly dragOver = signal(false);
  readonly extraction = signal<AiExtractResponse | null>(null);
  readonly draftContentId = signal<string | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly aiFilled = signal<Set<AiField>>(new Set());
  readonly manualEdited = signal<Set<AiField>>(new Set());

  private guardPollSub: Subscription | null = null;

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    durationMinutes: [null as number | null],
    difficulty: ['Medium'],
  });

  readonly tags = signal<string[]>([]);
  readonly outcomeCodes = signal<string[]>([]);
  readonly outcomeDescriptions = signal<Record<string, string>>({});
  readonly aiOutcomeCodes = signal<Set<string>>(new Set());
  readonly catalogOutcomes = signal<CatalogOutcome[]>([]);
  readonly outcomesLoading = signal(false);
  readonly outcomeCatalogExpanded = signal(false);

  readonly canBrowseOutcomes = computed(() =>
    this.selectedSubjects().length > 0 && this.selectedGradeLevels().length > 0,
  );

  readonly outcomeCatalogTitle = computed(() => {
    if (!this.canBrowseOutcomes()) return 'Katalogdan kazanım seç';
    const subjects = this.selectedSubjects().join(', ');
    const grades = this.selectedGradeLevels().map((g) => `${g}. Sınıf`).join(', ');
    return `${subjects} · ${grades} kazanımları`;
  });

  readonly selectedCatalogCount = computed(() => {
    const codes = new Set(this.outcomeCodes());
    return this.catalogOutcomes().filter((o) => codes.has(o.code)).length;
  });

  readonly confidencePct = computed(() => {
    const c = this.extraction()?.metadata.confidence ?? 0;
    return Math.round(c * 100);
  });

  constructor() {
    // Dersleri katalogdan yükle (16 MEB dersi); hata halinde fallback liste kalır.
    this.api.get<CatalogSubject[]>('/catalog/subjects').subscribe({
      next: (list) => {
        const names = (list ?? []).map((s) => s.name).filter(Boolean);
        if (names.length) this.catalogSubjects.set(names);
      },
    });
  }

  toggleSubject(name: string): void {
    const cur = this.selectedSubjects();
    this.selectedSubjects.set(cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
    this.onSubjectOrGradeChange();
  }

  toggleGradeLevel(grade: number): void {
    const cur = this.selectedGradeLevels();
    this.selectedGradeLevels.set(cur.includes(grade) ? cur.filter((x) => x !== grade) : [...cur, grade].sort((a, b) => a - b));
    this.onSubjectOrGradeChange();
  }

  private refreshCatalogOutcomes(): void {
    const subjects = this.selectedSubjects();
    const grades = this.selectedGradeLevels();
    if (!subjects.length || !grades.length) {
      this.catalogOutcomes.set([]);
      this.outcomesLoading.set(false);
      return;
    }
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

  descOf(code: string): string { return this.outcomeDescriptions()[code] ?? ''; }

  /** Açıklaması bilinmeyen kazanım kodları için Catalog'tan kod→açıklama çözer (AI ön-dolum). */
  private resolveOutcomeDescriptions(): void {
    const missing = this.outcomeCodes().filter((c) => !this.outcomeDescriptions()[c]);
    if (missing.length === 0) return;
    this.api.get<CatalogOutcome[]>('/catalog/outcomes/by-codes', { codes: missing.join(',') }).subscribe({
      next: (list) => {
        const map = { ...this.outcomeDescriptions() };
        for (const o of list ?? []) map[o.code] = o.description;
        this.outcomeDescriptions.set(map);
      },
    });
  }

  onSubjectOrGradeChange(): void {
    this.outcomeCatalogExpanded.set(false);
    this.refreshCatalogOutcomes();
  }

  toggleOutcomeCatalog(): void {
    this.outcomeCatalogExpanded.update((v) => !v);
  }

  isOutcomeSelected(code: string): boolean {
    return this.outcomeCodes().includes(code);
  }

  isAiSuggestedOutcome(code: string): boolean {
    return this.aiOutcomeCodes().has(code);
  }

  toggleOutcome(o: CatalogOutcome): void {
    if (this.isOutcomeSelected(o.code)) {
      this.removeOutcome(o.code);
    } else {
      this.addOutcomeWithDescription(o);
    }
  }

  private addOutcomeWithDescription(o: CatalogOutcome): void {
    if (this.outcomeCodes().includes(o.code)) return;
    this.outcomeCodes.set([...this.outcomeCodes(), o.code]);
    this.outcomeDescriptions.set({ ...this.outcomeDescriptions(), [o.code]: o.description });
    this.markManual('outcomeCodes');
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.handleFile(input.files[0]);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleFile(f);
  }

  private handleFile(file: File): void {
    this.uploadError.set(null);
    this.stopGuardPolling();
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!['.zip', '.html', '.htm'].includes(ext)) {
      this.uploadError.set('Sadece .zip, .html veya .htm yüklenebilir.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.uploadError.set('Dosya 50 MB sınırını aşıyor.');
      return;
    }

    this.phase.set('uploading');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', this.selectedType());

    this.api.postFormData<BundleUploadResponse>('/contents/bundle-upload', fd).subscribe({
      next: (uploaded) => {
        this.draftContentId.set(uploaded.contentId);
        this.extraction.set({
          bucket: uploaded.bucket,
          key: uploaded.key,
          manifestEntry: uploaded.manifestEntry,
          fileSizeBytes: uploaded.fileSizeBytes,
          sha256: uploaded.sha256,
          metadata: {
            title: null,
            description: null,
            subject: null,
            gradeLevel: null,
            durationMinutes: null,
            difficulty: null,
            outcomeCodes: [],
            tags: [],
            confidence: 0,
            candidateOutcomeCount: 0,
          },
          filesScanned: 0,
        });
        this.phase.set('guardScanning');
        this.startGuardPolling(uploaded.contentId);
      },
      error: (err) => {
        const r = (err as { error?: { error?: string; detail?: string } })?.error;
        this.uploadError.set(r?.error ?? r?.detail ?? 'Dosya yüklenemedi. Lütfen tekrar deneyin.');
        this.phase.set('idle');
      },
    });
  }

  private startGuardPolling(contentId: string): void {
    this.stopGuardPolling();
    this.guardPollSub = timer(0, 2000).pipe(
      switchMap(() => this.api.get<ContentProcessingStatusResponse>(`/contents/${contentId}/processing-status`)),
    ).subscribe({
      next: (status) => {
        if (status.guardRejected) {
          this.uploadError.set('Dosya Guard güvenlik taramasından geçemedi. Lütfen farklı bir bundle yükleyin.');
          this.phase.set('idle');
          this.stopGuardPolling();
          return;
        }
        if (status.canExtractMetadata) {
          this.stopGuardPolling();
          this.runMetadataExtract(contentId);
        }
      },
      error: () => {
        this.uploadError.set('Guard tarama durumu alınamadı.');
        this.phase.set('idle');
        this.stopGuardPolling();
      },
    });
  }

  private runMetadataExtract(contentId: string): void {
    this.phase.set('extracting');
    this.api.post<MetadataExtractResponse>(`/contents/${contentId}/metadata-extract`, {}).subscribe({
      next: (resp) => {
        const base = this.extraction();
        if (!base) return;
        this.extraction.set({
          ...base,
          metadata: resp.metadata,
          filesScanned: resp.filesScanned,
        });
        this.applyExtraction({
          ...base,
          metadata: resp.metadata,
          filesScanned: resp.filesScanned,
        });
      },
      error: (err) => {
        const r = (err as { error?: { error?: string; detail?: string } })?.error;
        this.uploadError.set(r?.error ?? r?.detail ?? 'AI metadata çıkarımı başarısız.');
        this.phase.set('idle');
      },
    });
  }

  private stopGuardPolling(): void {
    this.guardPollSub?.unsubscribe();
    this.guardPollSub = null;
  }

  private applyExtraction(resp: AiExtractResponse): void {
    this.extraction.set(resp);
    const m = resp.metadata;
    const filled = new Set<AiField>();

    this.form.patchValue({
      title: m.title ?? '',
      description: m.description ?? '',
      durationMinutes: m.durationMinutes ?? null,
      difficulty: m.difficulty ?? 'Medium',
    });
    this.selectedSubjects.set(m.subject ? [m.subject] : []);
    this.selectedGradeLevels.set(m.gradeLevel != null ? [m.gradeLevel] : []);
    if (m.title) filled.add('title');
    if (m.description) filled.add('description');
    if (m.subject) filled.add('subjects');
    if (m.gradeLevel != null) filled.add('gradeLevels');
    if (m.durationMinutes) filled.add('durationMinutes');
    if (m.difficulty) filled.add('difficulty');
    this.tags.set([...m.tags]);
    this.outcomeCodes.set([...m.outcomeCodes]);
    this.aiOutcomeCodes.set(new Set(m.outcomeCodes));
    if (m.outcomeCodes.length > 0) this.resolveOutcomeDescriptions();
    if (m.tags.length > 0) filled.add('tags');
    if (m.outcomeCodes.length > 0) filled.add('outcomeCodes');

    this.aiFilled.set(filled);
    this.manualEdited.set(new Set());
    this.refreshCatalogOutcomes();
    this.phase.set('form');
  }

  markManual(field: AiField): void {
    const m = new Set(this.manualEdited());
    m.add(field);
    this.manualEdited.set(m);
  }

  badgeClass(field: AiField): string {
    const base = 'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ';
    if (this.manualEdited().has(field)) return base + 'bg-panel text-muted';
    if (this.aiFilled().has(field)) return base + 'bg-violet-50 text-violet-700 border border-violet-200';
    return base + 'bg-panel text-dim border border-line/10';
  }
  badgeLabel(field: AiField): string {
    if (this.manualEdited().has(field)) return 'Manuel';
    if (this.aiFilled().has(field)) return 'AI Önerisi';
    return '—';
  }

  // ---- Tags ----
  addTag(e: MatChipInputEvent): void {
    const v = (e.value || '').trim().toLowerCase();
    if (v && !this.tags().includes(v)) {
      this.tags.set([...this.tags(), v]);
      this.markManual('tags');
    }
    e.chipInput?.clear();
  }
  removeTag(t: string): void {
    this.tags.set(this.tags().filter((x) => x !== t));
    this.markManual('tags');
  }

  // ---- Outcomes ----
  removeOutcome(code: string): void {
    this.outcomeCodes.set(this.outcomeCodes().filter((x) => x !== code));
    this.markManual('outcomeCodes');
  }

  // ---- Submit ----
  onSubmit(): void {
    if (this.form.invalid || !this.extraction() || !this.draftContentId()) return;
    if (this.selectedSubjects().length === 0) {
      this.submitError.set('En az bir ders seçmelisiniz.');
      return;
    }
    if (this.selectedType() === 'DigitalContent' && this.outcomeCodes().length === 0) {
      this.submitError.set('Dijital içerik için en az bir kazanım seçilmelidir.');
      return;
    }
    const ext = this.extraction()!;
    const v = this.form.value;
    const contentId = this.draftContentId()!;
    this.submitting.set(true);
    this.submitError.set(null);

    const m = ext.metadata;
    const metadataReq: UpdateMetadataRequest = {
      title: v.title!,
      type: this.selectedType(),
      description: v.description || null,
      subjects: this.selectedSubjects(),
      gradeLevels: this.selectedGradeLevels(),
      outcomeCodes: this.outcomeCodes(),
      tags: this.tags(),
      durationMinutes: v.durationMinutes ?? null,
      difficulty: v.difficulty ?? null,
      aiSuggestion: {
        subject: m.subject,
        gradeLevel: m.gradeLevel,
        durationMinutes: m.durationMinutes,
        difficulty: m.difficulty,
        outcomeCodes: m.outcomeCodes ?? [],
        tags: m.tags ?? [],
        confidence: m.confidence,
      },
    };

    this.api.put(`/contents/${contentId}/metadata`, metadataReq).subscribe({
      next: () => {
        this.api.post(`/contents/${contentId}/submit`, {}).subscribe({
          next: () => {
            this.submitting.set(false);
            this.router.navigate(['/teacher/contents']);
          },
          error: (e) => this.handleSubmitError(e),
        });
      },
      error: (e) => this.handleSubmitError(e),
    });
  }

  private handleSubmitError(e: unknown): void {
    const r = (e as { error?: { detail?: string; title?: string; error?: string } })?.error;
    this.submitError.set(r?.detail ?? r?.title ?? r?.error ?? 'Kaydetme başarısız.');
    this.submitting.set(false);
  }

  reset(): void {
    this.stopGuardPolling();
    this.phase.set('idle');
    this.selectedType.set('Game');
    this.extraction.set(null);
    this.draftContentId.set(null);
    this.form.reset({ difficulty: 'Medium' });
    this.selectedSubjects.set([]);
    this.selectedGradeLevels.set([]);
    this.tags.set([]);
    this.outcomeCodes.set([]);
    this.outcomeDescriptions.set({});
    this.aiOutcomeCodes.set(new Set());
    this.catalogOutcomes.set([]);
    this.outcomeCatalogExpanded.set(false);
    this.aiFilled.set(new Set());
    this.manualEdited.set(new Set());
    this.uploadError.set(null);
    this.submitError.set(null);
  }
}
