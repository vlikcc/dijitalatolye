import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/api/api.service';

/** İçerik (iframe) → host arasındaki postMessage sözleşmesi. da-sdk.js bu mesajları üretir. */
interface ContentTrackMessage {
  app: 'dijitalatolye';
  type: 'progress' | 'complete' | 'score';
  outcomeCode?: string;
  score?: number;
  durationSeconds?: number;
}

@Component({
  selector: 'da-play',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="da-science-bg min-h-screen">
      <section class="max-w-6xl mx-auto px-4 py-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <a routerLink="/discover" class="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest uppercase text-dim hover:text-accent transition mb-3">
              <mat-icon style="font-size:14px;width:14px;height:14px">arrow_back</mat-icon> Oyunlara dön
            </a>
            <h1 class="da-display text-2xl md:text-3xl font-bold text-ink flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 text-white inline-flex items-center justify-center shadow-lg shadow-accent/25">
                <mat-icon style="font-size:22px;width:22px;height:22px">sports_esports</mat-icon>
              </span>
              {{ slug }}
            </h1>
          </div>
          <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line/10 font-mono text-[11px] tracking-wider uppercase text-dim self-start">
            <mat-icon class="!text-accent" style="font-size:14px;width:14px;height:14px">shield</mat-icon>
            Sandbox güvenli
          </span>
        </div>

        <div class="rounded-2xl border border-line/10 bg-surface overflow-hidden shadow-card">
          <div class="px-4 h-10 flex items-center gap-2 border-b border-line/10 bg-bg2">
            <span class="flex gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-accent2/60"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-warm-500/60"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-accent/60"></span>
            </span>
            <span class="ml-2 font-mono text-[11px] tracking-wider text-dim truncate">{{ slug }} · izole oynatma</span>
          </div>
          <!-- GÜVENLİK: İçerik /cdn üzerinden uygulamayla AYNI origin'de servis edilir. Bu yüzden
               sandbox'a allow-same-origin EKLENMEZ; aksi halde güvenilmeyen öğretmen HTML'i app'in
               localStorage'ındaki JWT'ye erişebilirdi. allow-scripts ile içerik opaque origin'de çalışır;
               ilerleme bildirimi postMessage (da-sdk.js) ile yapılır (allow-same-origin gerektirmez). -->
          <iframe
            #frame
            [src]="playUrl"
            sandbox="allow-scripts"
            class="w-full h-[70vh] min-h-[520px] bg-white"
            title="play">
          </iframe>
        </div>
      </section>
    </div>
  `,
})
export class PlayComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('frame') private frame?: ElementRef<HTMLIFrameElement>;

  slug = '';
  playUrl: SafeResourceUrl = '';
  private startTime = Date.now();
  private contentId: string | null = null;
  private completedFromContent = false;
  private readonly messageHandler = (e: MessageEvent) => this.onContentMessage(e);

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    if (!this.slug) return;
    this.playUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`/api/contents/by-slug/${this.slug}/play`);
    window.addEventListener('message', this.messageHandler);
    this.api.get<{ id: string }>(`/search/contents/${this.slug}`).subscribe({
      next: (data) => {
        this.contentId = data?.id ?? null;
        if (this.contentId) {
          this.api.post('/analytics/events', { contentId: this.contentId, type: 'Play', durationSeconds: 0, source: 'web' }).subscribe();
        }
      },
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageHandler);
    // İçerik açıkça "complete" gönderdiyse çift sayım yapma; aksi halde eski davranış (süreyle Complete) korunur.
    if (!this.contentId || this.completedFromContent) return;
    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
    this.api.post('/analytics/events', { contentId: this.contentId, type: 'Complete', durationSeconds, source: 'web' }).subscribe();
  }

  /** İçerikten gelen track mesajlarını doğrulayıp Analytics'e iletir. */
  private onContentMessage(e: MessageEvent): void {
    // Yalnızca bizim iframe'imizden gelen, doğru marker'a sahip mesajları kabul et (origin-agnostik, güvenli).
    if (!this.contentId) return;
    if (e.source !== this.frame?.nativeElement.contentWindow) return;
    const msg = e.data as ContentTrackMessage | null;
    if (!msg || msg.app !== 'dijitalatolye') return;

    let type: 'Progress' | 'Complete';
    switch (msg.type) {
      case 'complete': type = 'Complete'; this.completedFromContent = true; break;
      case 'progress':
      case 'score': type = 'Progress'; break;
      default: return;
    }

    this.api.post('/analytics/events', {
      contentId: this.contentId,
      type,
      durationSeconds: typeof msg.durationSeconds === 'number' ? Math.round(msg.durationSeconds) : undefined,
      score: typeof msg.score === 'number' ? msg.score : undefined,
      outcomeCode: typeof msg.outcomeCode === 'string' ? msg.outcomeCode : undefined,
      source: 'content',
    }).subscribe();
  }
}
