import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { formatContentGradeLevels, formatContentSubjects } from '@core/api/contracts';
import {
  StudioKeySource, StudioModelsResponse, StudioService, StudioSessionDetail, StudioTurn, isTurnActive, studioErrorMessage,
} from '@core/api/studio.service';

const POLL_MS = 2500;

@Component({
  selector: 'da-studio-session',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/teacher/studio" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-4">
      <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> Stüdyoya dön
    </a>

    @if (loading()) {
      <div class="p-8 text-dim">Yükleniyor…</div>
    } @else if (!session()) {
      <div class="rounded-2xl bg-surface border border-rose-200 p-8 text-ink">Stüdyo oturumu bulunamadı.</div>
    } @else {
      <header class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-extrabold text-ink truncate">{{ session()!.title }}</h1>
          <p class="text-sm text-muted mt-1">
            {{ formatContentSubjects(session()!.subjects) }} · {{ formatContentGradeLevels(session()!.gradeLevels) }}
            @if (session()!.outcomeCodes.length) { · {{ session()!.outcomeCodes.length }} kazanım }
          </p>
        </div>
        @if (session()!.contentId) {
          <a [routerLink]="['/teacher/contents', session()!.contentId]"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold">
            <mat-icon style="font-size:18px;width:18px;height:18px">check_circle</mat-icon> Gönderildi — içeriğe git
          </a>
        } @else {
          <button type="button" (click)="submit()" [disabled]="!canSubmit()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20 disabled:opacity-50">
            @if (submitting()) { <mat-spinner diameter="16"></mat-spinner> }
            @else { <mat-icon style="font-size:18px;width:18px;height:18px">send</mat-icon> }
            Onaya gönder
          </button>
        }
      </header>

      @if (actionError()) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 mb-4" role="alert">{{ actionError() }}</div>
      }

      <div class="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
        <!-- Sohbet / sürümler -->
        <section class="rounded-2xl bg-surface border border-line/10 shadow-sm flex flex-col min-h-[560px]">
          <div class="flex-1 overflow-y-auto p-4 space-y-4 max-h-[640px]" aria-live="polite">
            @for (t of session()!.turns; track t.id) {
              <div class="flex justify-end">
                <div class="max-w-[90%] rounded-2xl rounded-br-sm bg-brand-50 border border-brand-100 px-3 py-2 text-sm text-ink whitespace-pre-line">{{ t.userPrompt }}</div>
              </div>
              <div class="flex">
                <div class="max-w-[95%] rounded-2xl rounded-bl-sm border px-3 py-2 text-sm"
                  [class]="t.id === session()!.selectedTurnId ? 'border-brand-300 bg-bg' : 'border-line/15 bg-bg'">
                  <p class="text-xs font-semibold text-dim mb-1">Sürüm {{ t.seq }} · {{ t.model }}</p>
                  @switch (t.status) {
                    @case ('Queued') {
                      <p class="inline-flex items-center gap-2 text-muted"><mat-spinner diameter="14"></mat-spinner> Sırada bekliyor…</p>
                    }
                    @case ('Running') {
                      <p class="inline-flex items-center gap-2 text-muted">
                        <mat-spinner diameter="14"></mat-spinner>
                        Oyun yazılıyor… {{ progressLabel(t) }}
                      </p>
                    }
                    @case ('Failed') {
                      <p class="text-rose-700">{{ t.error || 'Üretim başarısız oldu.' }}</p>
                    }
                    @case ('Succeeded') {
                      @if (t.changeSummary) {
                        <p class="text-ink whitespace-pre-line">{{ t.changeSummary }}</p>
                      } @else {
                        <p class="text-ink">Oyun hazır.</p>
                      }
                      <div class="mt-2 flex items-center gap-3 text-xs">
                        @if (t.id === session()!.selectedTurnId) {
                          <span class="inline-flex items-center gap-1 text-brand-700 font-semibold">
                            <mat-icon style="font-size:14px;width:14px;height:14px">visibility</mat-icon> Önizlenen sürüm
                          </span>
                        } @else if (!session()!.contentId) {
                          <button type="button" (click)="select(t)" class="text-brand-700 underline">Bu sürüme dön</button>
                        }
                        <span class="text-dim">{{ t.completionTokens | number }} token</span>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          @if (!session()!.contentId) {
            <div class="border-t border-line/10 p-4 space-y-2">
              <label for="studio-prompt" class="sr-only">Değişiklik isteği</label>
              <textarea id="studio-prompt" [(ngModel)]="prompt" rows="3" maxlength="4000" [disabled]="busy()"
                (keydown.control.enter)="send()" (keydown.meta.enter)="send()"
                placeholder="Örn. Süre sayacı ekle, renkleri daha canlı yap, yanlış cevapta ipucu göster…"
                class="w-full px-3 py-2.5 rounded-lg border border-line/15 bg-bg focus:border-brand-400 outline-none resize-y text-sm"></textarea>
              <div class="flex flex-wrap items-center gap-2">
                <label for="studio-turn-model" class="sr-only">Model</label>
                <select id="studio-turn-model" [(ngModel)]="model" [disabled]="busy()"
                  class="px-2 py-2 rounded-lg border border-line/15 bg-bg text-sm outline-none">
                  @for (m of meta()?.models ?? []; track m.id) { <option [value]="m.id">{{ m.label }}</option> }
                </select>
                <label for="studio-turn-key" class="sr-only">API anahtarı</label>
                <select id="studio-turn-key" [(ngModel)]="keySource" [disabled]="busy()"
                  class="px-2 py-2 rounded-lg border border-line/15 bg-bg text-sm outline-none">
                  <option value="Platform" [disabled]="!meta()?.platformKeyConfigured">Platform anahtarı</option>
                  <option value="User" [disabled]="!meta()?.hasUserKey">Kendi anahtarım</option>
                </select>
                <button type="button" (click)="send()" [disabled]="busy() || prompt.trim().length < 3"
                  class="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl da-grad text-white font-semibold text-sm disabled:opacity-50">
                  @if (sending()) { <mat-spinner diameter="14"></mat-spinner> }
                  @else { <mat-icon style="font-size:16px;width:16px;height:16px">auto_fix_high</mat-icon> }
                  {{ hasSucceeded() ? 'Değiştir' : 'Yeniden üret' }}
                </button>
              </div>
              @if (meta()?.platformKeyConfigured && keySource === 'Platform') {
                <p class="text-xs text-dim">Platform anahtarıyla bugün {{ meta()!.usedToday }}/{{ meta()!.dailyLimit }} üretim kullandınız.</p>
              }
            </div>
          }
        </section>

        <!-- Önizleme -->
        <section>
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold text-ink">Önizleme</h2>
            @if (previewRaw()) {
              <a [href]="previewRaw()" target="_blank" rel="noopener" class="text-xs text-brand-600 hover:underline">Yeni sekmede aç ↗</a>
            }
          </div>
          @if (preview()) {
            <iframe [src]="preview()" sandbox="allow-scripts" title="Oyun önizlemesi"
              class="w-full h-[600px] border border-line/10 rounded-2xl bg-surface"></iframe>
            <p class="text-xs text-dim mt-1.5">Oyun güvenli bir sandbox içinde çalışır. Onaya gönderdiğinizde güvenlik taraması, AI denetimi ve editör incelemesinden geçer.</p>
          } @else {
            <div class="w-full h-[600px] border border-dashed border-line/20 rounded-2xl flex flex-col items-center justify-center text-dim text-sm gap-3">
              @if (busy()) {
                <mat-spinner diameter="28"></mat-spinner>
                <p>Oyununuz hazırlanıyor. Bu işlem birkaç dakika sürebilir.</p>
              } @else {
                <mat-icon>videogame_asset_off</mat-icon>
                <p>Henüz önizlenecek bir sürüm yok.</p>
              }
            </div>
          }
        </section>
      </div>
    }
  `,
})
export class StudioSessionComponent implements OnInit, OnDestroy {
  private readonly studio = inject(StudioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly formatContentSubjects = formatContentSubjects;
  protected readonly formatContentGradeLevels = formatContentGradeLevels;

  readonly loading = signal(true);
  readonly session = signal<StudioSessionDetail | null>(null);
  readonly meta = signal<StudioModelsResponse | null>(null);
  readonly sending = signal(false);
  readonly submitting = signal(false);
  readonly actionError = signal<string | null>(null);

  prompt = '';
  model = '';
  keySource: StudioKeySource = 'Platform';

  private sessionId = '';
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  readonly busy = computed(() => this.sending() || (this.session()?.turns.some(isTurnActive) ?? false));
  readonly hasSucceeded = computed(() => this.session()?.turns.some((t) => t.status === 'Succeeded') ?? false);
  readonly selectedTurn = computed(() => {
    const s = this.session();
    return s?.turns.find((t) => t.id === s.selectedTurnId) ?? null;
  });
  readonly previewRaw = computed(() => this.selectedTurn()?.previewUrl ?? null);
  // previewRaw aynı kaldıkça yeniden hesaplanmaz: yoklama iframe'i yeniden yüklemez.
  readonly preview = computed<SafeResourceUrl | null>(() => {
    const raw = this.previewRaw();
    return raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
  });
  readonly canSubmit = computed(() =>
    !this.submitting() && !this.busy() && this.selectedTurn()?.status === 'Succeeded');

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.studio.models().subscribe({ next: (m) => this.meta.set(m) });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearPoll();
  }

  progressLabel(t: StudioTurn): string {
    const parts: string[] = [];
    if (t.progressChars > 0) parts.push(`~${Math.max(1, Math.round(t.progressChars / 1024))} KB`);
    if (t.startedAtUtc) {
      const secs = Math.max(0, Math.round((Date.now() - Date.parse(t.startedAtUtc)) / 1000));
      parts.push(secs >= 60 ? `${Math.floor(secs / 60)} dk ${secs % 60} sn` : `${secs} sn`);
    }
    return parts.length ? `(${parts.join(' · ')})` : '';
  }

  send(): void {
    const text = this.prompt.trim();
    if (this.busy() || text.length < 3) return;
    this.sending.set(true);
    this.actionError.set(null);
    this.studio.addTurn(this.sessionId, { prompt: text, model: this.model, keySource: this.keySource }).subscribe({
      next: () => {
        this.prompt = '';
        this.sending.set(false);
        this.refresh();
        this.studio.models().subscribe({ next: (m) => this.meta.set(m) });
      },
      error: (e) => {
        this.actionError.set(studioErrorMessage(e, 'İstek gönderilemedi.'));
        this.sending.set(false);
      },
    });
  }

  select(t: StudioTurn): void {
    this.actionError.set(null);
    this.studio.selectTurn(this.sessionId, t.id).subscribe({
      next: () => {
        const s = this.session();
        if (s) this.session.set({ ...s, selectedTurnId: t.id });
      },
      error: (e) => this.actionError.set(studioErrorMessage(e)),
    });
  }

  submit(): void {
    const turn = this.selectedTurn();
    if (!this.canSubmit() || !turn) return;
    if (!confirm(`Sürüm ${turn.seq} onaya gönderilsin mi? Gönderdikten sonra bu oturumda değişiklik yapılamaz.`)) return;
    this.submitting.set(true);
    this.actionError.set(null);
    this.studio.submit(this.sessionId).subscribe({
      next: (r) => this.router.navigate(['/teacher/contents', r.contentId]),
      error: (e) => {
        this.actionError.set(studioErrorMessage(e, 'Gönderim başarısız.'));
        this.submitting.set(false);
      },
    });
  }

  private refresh(): void {
    this.clearPoll();
    if (this.destroyed) return;
    this.studio.session(this.sessionId).subscribe({
      next: (s) => {
        const first = this.session() === null;
        this.session.set(s);
        if (first) {
          this.model = s.model;
          this.keySource = s.keySource;
        }
        this.loading.set(false);
        if (s.turns.some(isTurnActive)) this.pollTimer = setTimeout(() => this.refresh(), POLL_MS);
      },
      error: () => {
        this.loading.set(false);
        // Geçici ağ hatasında yoklamayı sürdür; oturum hiç yüklenmediyse dur.
        if (this.session()) this.pollTimer = setTimeout(() => this.refresh(), POLL_MS * 2);
      },
    });
  }

  private clearPoll(): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }
}
