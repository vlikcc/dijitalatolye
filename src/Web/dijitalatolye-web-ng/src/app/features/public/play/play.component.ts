import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@core/api/api.service';

@Component({
  selector: 'da-play',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="max-w-5xl mx-auto px-4 py-6">
      <h1 class="text-xl font-bold mb-4">Oynat: {{ slug }}</h1>
      <iframe
        [src]="playUrl"
        sandbox="allow-scripts allow-same-origin"
        class="w-full h-[640px] border border-slate-200 rounded bg-white"
        title="play">
      </iframe>
    </section>
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
