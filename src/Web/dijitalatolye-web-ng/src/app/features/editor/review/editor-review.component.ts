import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/api/api.service';

interface LlmRow { label: string; value: string | null; depth: number; header: boolean; }

/** LLM ham JSON anahtarları → Türkçe etiketler (okunabilir liste için). */
const LLM_LABELS: Record<string, string> = {
  score: 'Puan', summary: 'Özet', rubric: 'Değerlendirme Kriterleri',
  pedagogicalFit: 'Pedagojik Uygunluk', languageQuality: 'Dil Kalitesi',
  safety: 'Güvenlik', accessibility: 'Erişilebilirlik', interactionQuality: 'Etkileşim Kalitesi',
  rationale: 'Gerekçe', outcomeAlignment: 'Kazanım Uyumu',
  flags: 'Kritik Bulgular', warnings: 'Uyarılar', suggestedRevisions: 'Revizyon Önerileri',
};
const SCALAR_LABELS: Record<string, string> = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };

interface ReviewItem { id: string; contentId: string; versionId: string; title: string; aiScore: number; aiDecision: string; aiReportId: string; }
interface ModerationReport {
  id: string; score: number; decision: string;
  criticalFlags: string[]; warnings: string[]; externalUrls: string[];
  suggestedCsp: string; llmRawJson: string;
}

interface ContentMeta {
  id: string; subject?: string | null; gradeLevel?: number | null; difficulty?: string | null;
  outcomeCodes: string[]; tags: string[]; aiSuggestionJson?: string | null;
}

interface AiSuggestion {
  subject?: string | null; gradeLevel?: number | null; durationMinutes?: number | null;
  difficulty?: string | null; outcomeCodes: string[]; tags: string[]; confidence: number;
}

type Decision = 'Approved' | 'Rejected' | 'RevisionRequested';

@Component({
  selector: 'da-editor-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!item()) {
      <p class="text-dim">Yükleniyor...</p>
    } @else {
      <section class="grid lg:grid-cols-2 gap-6">
        <div>
          <h1 class="text-xl font-bold mb-4 text-ink">{{ item()!.title }}</h1>
          <div class="bg-surface border border-line/10 rounded p-4 mb-4">
            <h2 class="font-semibold mb-2">AI Raporu</h2>
            @if (report()) {
              <div class="space-y-2 text-sm">
                <p><b>Skor:</b> {{ report()!.score }} · <b>Karar:</b> {{ report()!.decision }}</p>
                @if (report()!.criticalFlags.length > 0) {
                  <div>
                    <p class="font-semibold text-rose-700">Kritik Bulgular</p>
                    <ul class="list-disc list-inside text-rose-700">
                      @for (f of report()!.criticalFlags; track f) { <li>{{ f }}</li> }
                    </ul>
                  </div>
                }
                @if (report()!.warnings.length > 0) {
                  <div>
                    <p class="font-semibold text-amber-700">Uyarılar</p>
                    <ul class="list-disc list-inside text-amber-700">
                      @for (f of report()!.warnings; track f) { <li>{{ f }}</li> }
                    </ul>
                  </div>
                }
                @if (llmRows().length > 0) {
                  <div>
                    <p class="font-semibold text-dim text-xs uppercase tracking-wide mb-1">AI Değerlendirme Detayı</p>
                    <ul class="space-y-0.5">
                      @for (row of llmRows(); track $index) {
                        <li class="text-sm leading-snug" [style.padding-left.px]="row.depth * 14">
                          @if (row.header) {
                            <span class="font-semibold text-ink">{{ row.label }}</span>
                          } @else if (row.label) {
                            <span class="text-dim">{{ row.label }}:</span> <span class="text-ink">{{ row.value }}</span>
                          } @else {
                            <span class="text-ink">• {{ row.value }}</span>
                          }
                        </li>
                      }
                    </ul>
                  </div>
                }
                @if (llmParseFailed()) {
                  <details class="text-xs"><summary>LLM ham yanıt</summary><pre class="overflow-x-auto bg-panel p-2 mt-1">{{ report()!.llmRawJson }}</pre></details>
                }
              </div>
            } @else {
              <p class="text-sm text-dim">Rapor yükleniyor...</p>
            }
          </div>

          <div class="bg-surface border border-line/10 rounded p-4 mb-4">
            <h2 class="font-semibold mb-2 inline-flex items-center gap-2">
              AI Metadata Önerisi
              @if (ai()) { <span class="text-xs font-normal text-dim">güven %{{ aiConfidencePct() }}</span> }
            </h2>
            @if (!content()) {
              <p class="text-sm text-dim">Yükleniyor...</p>
            } @else if (!ai()) {
              <p class="text-sm text-dim">Bu içerik için AI önerisi kaydedilmemiş.</p>
            } @else {
              <div class="space-y-3 text-sm">
                <div>
                  <p class="font-semibold text-dim text-xs uppercase tracking-wide mb-1">Kazanım kodları</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-xs text-dim mb-1">Öğretmenin seçimi</p>
                      <div class="flex flex-wrap gap-1">
                        @for (c of content()!.outcomeCodes; track c) {
                          <span class="font-mono text-xs px-1.5 py-0.5 rounded bg-panel border border-line/10">{{ c }}</span>
                        } @empty { <span class="text-xs text-dim">—</span> }
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-dim mb-1">AI önerisi</p>
                      <div class="flex flex-wrap gap-1">
                        @for (c of ai()!.outcomeCodes; track c) {
                          <span class="font-mono text-xs px-1.5 py-0.5 rounded border"
                            [class]="content()!.outcomeCodes.includes(c) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">{{ c }}</span>
                        } @empty { <span class="text-xs text-dim">—</span> }
                      </div>
                    </div>
                  </div>
                  @if (outcomesDiffer()) {
                    <button (click)="applyOutcomes()" [disabled]="busy()"
                      class="mt-2 text-xs px-2 py-1 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">Kazanımları uygula</button>
                  }
                </div>
                <div>
                  <p class="font-semibold text-dim text-xs uppercase tracking-wide mb-1">Etiketler</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-xs text-dim mb-1">Öğretmenin seçimi</p>
                      <div class="flex flex-wrap gap-1">
                        @for (t of content()!.tags; track t) { <span class="text-xs px-1.5 py-0.5 rounded bg-panel border border-line/10">{{ t }}</span> } @empty { <span class="text-xs text-dim">—</span> }
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-dim mb-1">AI önerisi</p>
                      <div class="flex flex-wrap gap-1">
                        @for (t of ai()!.tags; track t) {
                          <span class="text-xs px-1.5 py-0.5 rounded border"
                            [class]="content()!.tags.includes(t) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">{{ t }}</span>
                        } @empty { <span class="text-xs text-dim">—</span> }
                      </div>
                    </div>
                  </div>
                  @if (tagsDiffer()) {
                    <button (click)="applyTags()" [disabled]="busy()"
                      class="mt-2 text-xs px-2 py-1 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">Etiketleri uygula</button>
                  }
                </div>
                <div class="flex gap-6 text-xs text-dim">
                  <span>Zorluk: <b class="text-ink">{{ content()!.difficulty || '—' }}</b> · AI: {{ ai()!.difficulty || '—' }}</span>
                  <span>Sınıf: <b class="text-ink">{{ content()!.gradeLevel ?? '—' }}</b> · AI: {{ ai()!.gradeLevel ?? '—' }}</span>
                </div>
              </div>
            }
          </div>

          <textarea placeholder="Editör yorumu (opsiyonel)" [(ngModel)]="comment" rows="3"
            class="w-full px-3 py-2 border border-line/10 rounded mb-3 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"></textarea>
          <div class="flex gap-2 flex-wrap">
            <button [disabled]="busy()" (click)="decide('Approved')" class="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60">Onayla</button>
            <button [disabled]="busy()" (click)="decide('RevisionRequested')" class="px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-60">Revizyon İste</button>
            <button [disabled]="busy()" (click)="decide('Rejected')" class="px-3 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-60">Reddet</button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold text-ink">Oyun Önizleme (sandbox)</h2>
            @if (playUrlRaw()) {
              <a [href]="playUrlRaw()" target="_blank" rel="noopener"
                class="text-xs text-brand-600 hover:underline">Yeni sekmede aç ↗</a>
            }
          </div>
          @if (playUrl()) {
            <iframe [src]="playUrl()" sandbox="allow-scripts"
              class="w-full h-[480px] border border-line/10 rounded bg-surface" title="oyun-önizleme"></iframe>
            <p class="text-xs text-dim mt-1.5">Oyun güvenli bir sandbox içinde çalışır; tam ekran için yeni sekmede açabilirsiniz.</p>
          } @else if (playError()) {
            <p class="text-sm text-rose-700">Oyun önizlemesi yüklenemedi: {{ playError() }}</p>
          } @else {
            <div class="flex items-center gap-2 text-sm text-dim h-[120px] justify-center border border-dashed border-line/20 rounded">
              Oyun önizlemesi hazırlanıyor…
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class EditorReviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly item = signal<ReviewItem | null>(null);
  readonly report = signal<ModerationReport | null>(null);
  readonly content = signal<ContentMeta | null>(null);
  readonly ai = signal<AiSuggestion | null>(null);
  readonly playUrl = signal<SafeResourceUrl | null>(null);
  readonly playUrlRaw = signal<string | null>(null);
  readonly playError = signal<string | null>(null);
  readonly busy = signal(false);
  comment = '';

  /** LLM ham JSON'ı okunabilir, girintili satırlara dönüştürür. */
  readonly llmRows = computed<LlmRow[]>(() => {
    const raw = this.report()?.llmRawJson;
    if (!raw) return [];
    try {
      const obj = JSON.parse(raw) as unknown;
      if (obj === null || typeof obj !== 'object') return [];
      const rows: LlmRow[] = [];
      this.flattenLlm(obj, 0, rows);
      return rows;
    } catch { return []; }
  });

  readonly llmParseFailed = computed(() => {
    const raw = this.report()?.llmRawJson;
    if (!raw) return false;
    try { JSON.parse(raw); return false; } catch { return true; }
  });

  private prettifyKey(k: string): string {
    return LLM_LABELS[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
  }

  private formatScalar(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır';
    const s = String(v);
    return SCALAR_LABELS[s] ?? s;
  }

  private flattenLlm(value: unknown, depth: number, rows: LlmRow[]): void {
    if (value === null || typeof value !== 'object') return;
    const isArray = Array.isArray(value);
    const entries: Array<readonly [string, unknown]> = isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as const)
      : Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) { rows.push({ label: '', value: '—', depth, header: false }); return; }
    for (const [k, v] of entries) {
      const label = isArray ? '' : this.prettifyKey(k);
      if (v !== null && typeof v === 'object') {
        rows.push({ label: label || '•', value: null, depth, header: true });
        this.flattenLlm(v, depth + 1, rows);
      } else {
        rows.push({ label, value: this.formatScalar(v), depth, header: false });
      }
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.get<ReviewItem>(`/review/${id}`).subscribe({
      next: (data) => {
        this.item.set(data);
        if (data.aiReportId) {
          this.api.get<ModerationReport>(`/moderation/reports/${data.aiReportId}`).subscribe({
            next: (r) => this.report.set(r),
          });
        }
        if (data.contentId) {
          this.loadContent(data.contentId);
          this.loadPreview(data.contentId);
        }
      },
    });
  }

  /** Editör inceleme önizlemesi: yayınlanmamış bundle'ı oynanabilir public URL olarak alır. */
  private loadPreview(contentId: string): void {
    this.playError.set(null);
    this.api.get<{ url: string }>(`/contents/${contentId}/preview-url`).subscribe({
      next: (r) => {
        if (!r?.url) { this.playError.set('Önizleme adresi alınamadı.'); return; }
        this.playUrlRaw.set(r.url);
        this.playUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(r.url));
      },
      error: (e) => {
        const msg = (e as { error?: { error?: string; detail?: string } })?.error;
        this.playError.set(msg?.error ?? msg?.detail ?? 'Oyun paketi açılamadı.');
      },
    });
  }

  private loadContent(contentId: string): void {
    this.api.get<ContentMeta>(`/contents/${contentId}`).subscribe({
      next: (c) => {
        this.content.set(c);
        if (c?.aiSuggestionJson) {
          try { this.ai.set(JSON.parse(c.aiSuggestionJson) as AiSuggestion); }
          catch { this.ai.set(null); }
        } else {
          this.ai.set(null);
        }
      },
    });
  }

  aiConfidencePct(): number { return Math.round((this.ai()?.confidence ?? 0) * 100); }

  outcomesDiffer(): boolean {
    const cur = this.content()?.outcomeCodes ?? [];
    const sug = this.ai()?.outcomeCodes ?? [];
    return sug.length > 0 && (cur.length !== sug.length || sug.some((c) => !cur.includes(c)));
  }

  tagsDiffer(): boolean {
    const cur = this.content()?.tags ?? [];
    const sug = this.ai()?.tags ?? [];
    return sug.length > 0 && (cur.length !== sug.length || sug.some((t) => !cur.includes(t)));
  }

  applyOutcomes(): void { this.applyEditorMetadata({ outcomeCodes: this.ai()?.outcomeCodes ?? [] }); }
  applyTags(): void { this.applyEditorMetadata({ tags: this.ai()?.tags ?? [] }); }

  private applyEditorMetadata(patch: Record<string, unknown>): void {
    const contentId = this.content()?.id;
    if (!contentId) return;
    this.busy.set(true);
    this.api.put(`/contents/${contentId}/editor-metadata`, patch).subscribe({
      next: () => { this.busy.set(false); this.loadContent(contentId); },
      error: () => this.busy.set(false),
    });
  }

  decide(decision: Decision): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.busy.set(true);
    this.api.post(`/review/${id}/decision`, { decision, comment: this.comment }).subscribe({
      next: () => { this.busy.set(false); this.router.navigate(['/editor/queue']); },
      error: () => this.busy.set(false),
    });
  }
}
