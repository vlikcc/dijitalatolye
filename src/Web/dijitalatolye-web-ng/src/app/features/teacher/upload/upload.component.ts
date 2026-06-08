import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { debounceTime, switchMap, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/api/api.service';
import {
  AiExtractResponse, CatalogOutcome, CatalogSubject,
  CreateContentRequest, AddVersionRequest,
} from '@core/api/contracts';

type AiField = 'title' | 'description' | 'subject' | 'gradeLevel' | 'durationMinutes' | 'difficulty' | 'tags' | 'outcomeCodes';

@Component({
  selector: 'da-teacher-upload',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatChipsModule, MatAutocompleteModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonToggleModule, MatSliderModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl font-extrabold text-ink">İçerik Yükle</h1>
        <p class="text-sm text-muted mt-1">
          ZIP veya HTML bundle'ınızı yükleyin; AI sizin için başlık, ders, sınıf, süre, kazanım ve etiketleri otomatik doldursun.
        </p>
      </header>

      <!-- DROPZONE -->
      @if (phase() === 'idle' || phase() === 'extracting') {
        <div class="rounded-2xl border-2 border-dashed bg-surface p-12 text-center transition"
             [class.border-brand-400]="dragOver()"
             [class.bg-brand-50]="dragOver()"
             [class.border-line]="!dragOver()"
             (dragenter)="$event.preventDefault(); dragOver.set(true)"
             (dragover)="$event.preventDefault(); dragOver.set(true)"
             (dragleave)="dragOver.set(false)"
             (drop)="onDrop($event)">
          <div class="mx-auto inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white items-center justify-center mb-4 shadow-lg shadow-brand-700/20">
            <mat-icon style="font-size:32px;width:32px;height:32px">cloud_upload</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-ink">Dosyayı buraya bırakın</h2>
          <p class="text-sm text-muted mt-1">veya tıklayıp seçin. ZIP ya da tek HTML, en fazla 50 MB.</p>
          <button (click)="fileInput.click()" type="button"
            class="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20">
            <mat-icon style="font-size:16px;width:16px;height:16px">folder_open</mat-icon>
            Dosya seç
          </button>
          <input #fileInput type="file" hidden accept=".zip,.html,.htm" (change)="onFileSelected($event)" />

          @if (phase() === 'extracting') {
            <div class="mt-8 max-w-md mx-auto">
              <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
              <p class="mt-3 text-sm text-brand-700 font-medium inline-flex items-center gap-2">
                <mat-icon style="font-size:16px;width:16px;height:16px">auto_awesome</mat-icon>
                AI içeriği analiz ediyor… (5-30 sn)
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

            <!-- Ders + Sınıf yan yana -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted flex items-center gap-2">
                  Ders <span [class]="badgeClass('subject')">{{ badgeLabel('subject') }}</span>
                </label>
                <select formControlName="subject" (change)="markManual('subject')"
                  class="w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none">
                  <option value="">Seçiniz…</option>
                  @for (s of subjects(); track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted flex items-center gap-2">
                  Sınıf <span [class]="badgeClass('gradeLevel')">{{ badgeLabel('gradeLevel') }}</span>
                </label>
                <select formControlName="gradeLevel" (change)="markManual('gradeLevel')"
                  class="w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none">
                  <option [ngValue]="null">Seçiniz…</option>
                  @for (g of grades; track g) { <option [ngValue]="g">{{ g }}. Sınıf</option> }
                </select>
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
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted flex items-center gap-2">
                Kazanım kodları (MEB) <span [class]="badgeClass('outcomeCodes')">{{ badgeLabel('outcomeCodes') }}</span>
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-chip-grid #outcomeGrid>
                  @for (code of outcomeCodes(); track code) {
                    <mat-chip-row (removed)="removeOutcome(code)">
                      <span class="font-semibold">{{ code }}</span>@if (descOf(code)) {<span class="text-dim"> — {{ descOf(code) }}</span>}
                      <button matChipRemove><mat-icon>cancel</mat-icon></button>
                    </mat-chip-row>
                  }
                </mat-chip-grid>
                <input placeholder="Kazanım ara veya kod gir…"
                  [(ngModel)]="outcomeQuery" [ngModelOptions]="{ standalone: true }"
                  [matAutocomplete]="outcomeAuto"
                  [matChipInputFor]="outcomeGrid"
                  [matChipInputSeparatorKeyCodes]="separatorKeys"
                  (matChipInputTokenEnd)="addOutcomeFromInput($event)" />
              </mat-form-field>
              <mat-autocomplete #outcomeAuto="matAutocomplete" (optionSelected)="addOutcomeFromAutocomplete($event)">
                @for (o of outcomeOptions(); track o.code) {
                  <mat-option [value]="o.code"><b>{{ o.code }}</b> — {{ o.description }}</mat-option>
                }
              </mat-autocomplete>
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
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60">
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
  readonly subjects = signal<string[]>(['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce']);
  readonly grades = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly separatorKeys = [ENTER, COMMA];

  readonly phase = signal<'idle' | 'extracting' | 'form'>('idle');
  readonly dragOver = signal(false);
  readonly extraction = signal<AiExtractResponse | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly aiFilled = signal<Set<AiField>>(new Set());
  readonly manualEdited = signal<Set<AiField>>(new Set());

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    subject: ['', Validators.required],
    gradeLevel: [null as number | null],
    durationMinutes: [null as number | null],
    difficulty: ['Medium'],
  });

  readonly tags = signal<string[]>([]);
  readonly outcomeCodes = signal<string[]>([]);
  readonly outcomeDescriptions = signal<Record<string, string>>({});
  outcomeQuery = '';

  descOf(code: string): string { return this.outcomeDescriptions()[code] ?? ''; }

  /** Açıklaması bilinmeyen kazanım kodları için Catalog'tan kod→açıklama çözer (AI ön-dolum/manuel giriş). */
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

  // Outcome autocomplete: Catalog.API'den arama
  private readonly outcomeQuery$ = signal(this.outcomeQuery);
  readonly outcomeOptions = signal<CatalogOutcome[]>([]);

  readonly confidencePct = computed(() => {
    const c = this.extraction()?.metadata.confidence ?? 0;
    return Math.round(c * 100);
  });

  constructor() {
    // Outcome autocomplete: form'dan subject/grade okuyup catalog'a sorgu
    toObservable(this.outcomeQuery$).pipe(
      debounceTime(300),
      switchMap((q) => {
        const subject = this.form.value.subject || undefined;
        const grade = this.form.value.gradeLevel ?? undefined;
        if (!subject && !grade && !q) return of([] as CatalogOutcome[]);
        return this.api.get<CatalogOutcome[]>('/catalog/outcomes', { subject, grade, limit: 50 });
      }),
    ).subscribe({ next: (list) => this.outcomeOptions.set(list) });

    // Dersleri katalogdan yükle (16 MEB dersi); hata halinde fallback liste kalır.
    this.api.get<CatalogSubject[]>('/catalog/subjects').subscribe({
      next: (list) => {
        const names = (list ?? []).map((s) => s.name).filter(Boolean);
        if (names.length) this.subjects.set(names);
      },
    });
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
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!['.zip', '.html', '.htm'].includes(ext)) {
      this.uploadError.set('Sadece .zip, .html veya .htm yüklenebilir.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.uploadError.set('Dosya 50 MB sınırını aşıyor.');
      return;
    }

    this.phase.set('extracting');
    const fd = new FormData();
    fd.append('file', file);

    this.api.postFormData<AiExtractResponse>('/contents/ai-extract', fd).subscribe({
      next: (resp) => this.applyExtraction(resp),
      error: (err) => {
        const r = (err as { error?: { error?: string; detail?: string } })?.error;
        this.uploadError.set(r?.error ?? r?.detail ?? 'AI çıkarımı başarısız oldu. Lütfen tekrar deneyin.');
        this.phase.set('idle');
      },
    });
  }

  private applyExtraction(resp: AiExtractResponse): void {
    this.extraction.set(resp);
    const m = resp.metadata;
    const filled = new Set<AiField>();

    this.form.patchValue({
      title: m.title ?? '',
      description: m.description ?? '',
      subject: m.subject ?? '',
      gradeLevel: m.gradeLevel ?? null,
      durationMinutes: m.durationMinutes ?? null,
      difficulty: m.difficulty ?? 'Medium',
    });
    if (m.title) filled.add('title');
    if (m.description) filled.add('description');
    if (m.subject) filled.add('subject');
    if (m.gradeLevel) filled.add('gradeLevel');
    if (m.durationMinutes) filled.add('durationMinutes');
    if (m.difficulty) filled.add('difficulty');
    this.tags.set([...m.tags]);
    this.outcomeCodes.set([...m.outcomeCodes]);
    if (m.outcomeCodes.length > 0) this.resolveOutcomeDescriptions();
    if (m.tags.length > 0) filled.add('tags');
    if (m.outcomeCodes.length > 0) filled.add('outcomeCodes');

    this.aiFilled.set(filled);
    this.manualEdited.set(new Set());
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
  addOutcomeFromInput(e: MatChipInputEvent): void {
    const v = (e.value || '').trim();
    if (v && !this.outcomeCodes().includes(v)) {
      this.outcomeCodes.set([...this.outcomeCodes(), v]);
      this.markManual('outcomeCodes');
      this.resolveOutcomeDescriptions();
    }
    e.chipInput?.clear();
    this.outcomeQuery = '';
    this.outcomeQuery$.set('');
  }
  addOutcomeFromAutocomplete(e: MatAutocompleteSelectedEvent): void {
    const v = e.option.value as string;
    if (v && !this.outcomeCodes().includes(v)) {
      this.outcomeCodes.set([...this.outcomeCodes(), v]);
      this.markManual('outcomeCodes');
      // Açıklamayı seçilen seçenekten yakala (anında göster).
      const opt = this.outcomeOptions().find((o) => o.code === v);
      if (opt) this.outcomeDescriptions.set({ ...this.outcomeDescriptions(), [v]: opt.description });
    }
    this.outcomeQuery = '';
    this.outcomeQuery$.set('');
  }
  removeOutcome(code: string): void {
    this.outcomeCodes.set(this.outcomeCodes().filter((x) => x !== code));
    this.markManual('outcomeCodes');
  }
  @ViewChild('outcomeAuto') outcomeAuto?: ElementRef;

  // ---- Submit ----
  onSubmit(): void {
    if (this.form.invalid || !this.extraction()) return;
    const ext = this.extraction()!;
    const v = this.form.value;
    this.submitting.set(true);
    this.submitError.set(null);

    const m = ext.metadata;
    const createReq: CreateContentRequest = {
      title: v.title!,
      description: v.description || null,
      subject: v.subject!,
      gradeLevel: v.gradeLevel ?? null,
      outcomeCodes: this.outcomeCodes(),
      tags: this.tags(),
      durationMinutes: v.durationMinutes ?? null,
      difficulty: v.difficulty ?? null,
      // AI önerisini editör karşılaştırması için kalıcılaştır (öğretmenin final seçiminden bağımsız).
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

    this.api.post<{ id: string }>('/contents', createReq).subscribe({
      next: (created) => {
        const versionReq: AddVersionRequest = {
          bucket: ext.bucket,
          key: ext.key,
          manifestEntry: ext.manifestEntry,
          fileSizeBytes: ext.fileSizeBytes,
          sha256: ext.sha256,
          changeLog: 'İlk versiyon (AI destekli upload)',
        };
        this.api.post(`/contents/${created.id}/versions`, versionReq).subscribe({
          next: () => {
            this.api.post(`/contents/${created.id}/submit`, {}).subscribe({
              next: () => {
                this.submitting.set(false);
                this.router.navigate(['/teacher/contents']);
              },
              error: (e) => this.handleSubmitError(e),
            });
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
    this.phase.set('idle');
    this.extraction.set(null);
    this.form.reset({ difficulty: 'Medium' });
    this.tags.set([]);
    this.outcomeCodes.set([]);
    this.aiFilled.set(new Set());
    this.manualEdited.set(new Set());
    this.uploadError.set(null);
    this.submitError.set(null);
  }
}
