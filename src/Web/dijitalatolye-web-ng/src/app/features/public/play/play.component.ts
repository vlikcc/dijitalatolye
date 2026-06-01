import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/api/api.service';

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
          <iframe
            [src]="playUrl"
            sandbox="allow-scripts allow-same-origin"
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

  slug = '';
  playUrl: SafeResourceUrl = '';
  private startTime = Date.now();
  private contentId: string | null = null;

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    if (!this.slug) return;
    this.playUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`/api/contents/by-slug/${this.slug}/play`);
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
    if (!this.contentId) return;
    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
    this.api.post('/analytics/events', { contentId: this.contentId, type: 'Complete', durationSeconds, source: 'web' }).subscribe();
  }
}
