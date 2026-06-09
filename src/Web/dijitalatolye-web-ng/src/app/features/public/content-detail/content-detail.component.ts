import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';
import { formatContentGradeLevels, formatContentSubjects } from '@core/api/contracts';

interface ContentDetail {
  id: string;
  title: string;
  description?: string;
  slug?: string | null;
  subjects?: string[];
  gradeLevels?: number[];
  tags?: string[];
  outcomeCodes?: string[];
  authorName?: string;
  views?: number;
  likes?: number;
}

interface Comment { id: string; body: string; userId: string; createdAt: string; }

@Component({
  selector: 'da-content-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notFound()) {
      <p class="p-6 text-rose-700">İçerik bulunamadı.</p>
    } @else if (!content()) {
      <p class="p-6">Yükleniyor…</p>
    } @else {
      <div class="max-w-4xl mx-auto p-6">
        <div class="text-sm text-dim">{{ formatContentSubjects(content()!.subjects) }} · {{ formatContentGradeLevels(content()!.gradeLevels) }}</div>
        <h1 class="text-3xl font-bold mt-1">{{ content()!.title }}</h1>
        @if (content()!.authorName) {
          <p class="text-sm text-muted">Yazar: {{ content()!.authorName }}</p>
        }

        <div class="mt-4 flex flex-wrap gap-2">
          @for (t of content()!.tags || []; track t) {
            <span class="text-xs bg-panel rounded px-2 py-0.5">{{ t }}</span>
          }
        </div>

        @if (content()!.outcomeCodes?.length) {
          <div class="mt-3">
            <div class="text-xs text-dim mb-1">Kazanımlar</div>
            <div class="flex flex-wrap gap-2">
              @for (code of content()!.outcomeCodes || []; track code) {
                <a [routerLink]="['/discover']" [queryParams]="{ outcome: code }"
                  class="text-xs font-mono bg-brand-50 text-brand-800 rounded px-2 py-0.5 hover:bg-brand-100 transition"
                  title="Bu kazanımdaki diğer içerikler">{{ code }}</a>
              }
            </div>
          </div>
        }

        @if (content()!.description) {
          <p class="mt-4 text-muted">{{ content()!.description }}</p>
        }

        <div class="mt-6 flex gap-3 items-center flex-wrap">
          @if (content()!.slug) {
            <a [routerLink]="['/play', content()!.slug]" class="px-4 py-2 rounded-lg da-grad text-white font-semibold">Oyna</a>
          } @else {
            <span class="px-4 py-2 rounded-lg da-grad text-white font-semibold opacity-50 cursor-not-allowed" title="İçerik henüz yayınlanmadı">Oyna</span>
          }
          <button (click)="like()" class="px-3 py-2 rounded-lg border border-line/15 hover:bg-panel">♥ {{ content()!.likes ?? 0 }}</button>
          <button (click)="favorite()" class="px-3 py-2 rounded-lg border border-line/15 hover:bg-panel">★ Favori</button>
          <button (click)="share()" class="px-3 py-2 rounded-lg border border-line/15 hover:bg-panel">Paylaş</button>
          @if (!content()!.slug) {
            <span class="text-xs text-amber-700">Bu içerik henüz yayında değil; yayına alındığında oynatılabilir olacak.</span>
          }
        </div>

        <h2 class="text-xl font-semibold mt-10 mb-3">Yorumlar</h2>
        <div class="bg-surface border border-line/15 rounded-lg p-4">
          <textarea rows="3" placeholder="Yorumunuzu yazın…"
            [(ngModel)]="newComment"
            class="w-full px-3 py-2 rounded-lg border border-line/15 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"></textarea>
          <div class="text-right mt-2">
            <button (click)="submitComment()" [disabled]="busy() || !newComment.trim()"
              class="px-4 py-2 rounded-lg da-grad text-white font-semibold disabled:opacity-50">Gönder</button>
          </div>
        </div>

        <ul class="mt-4 space-y-3">
          @for (c of comments(); track c.id) {
            <li class="bg-panel border border-line/15 rounded p-3">
              <p class="text-sm">{{ c.body }}</p>
              <p class="text-xs text-dim mt-1">{{ formatDate(c.createdAt) }}</p>
            </li>
          }
        </ul>

        @if (similar().length > 0) {
          <div class="mt-10">
            <h2 class="text-xl font-semibold mb-4">Buna Benzer İçerikler</h2>
            <div class="flex overflow-x-auto gap-4 pb-4 snap-x">
              @for (it of similar(); track it.id) {
                <a [routerLink]="['/contents', it.slug || it.id]"
                  class="snap-start shrink-0 w-64 border border-line/15 rounded-lg p-4 hover:shadow transition bg-surface">
                  <div class="text-xs text-dim mb-1">{{ formatContentSubjects(it.subjects) }} · {{ formatContentGradeLevels(it.gradeLevels) }}</div>
                  <h3 class="font-semibold text-base line-clamp-2">{{ it.title }}</h3>
                  @if (it.description) {
                    <p class="text-sm text-muted mt-2 line-clamp-2">{{ it.description }}</p>
                  }
                  <div class="text-xs text-dim mt-3 flex gap-3">
                    <span>👁 {{ it.views ?? 0 }}</span>
                    <span>♥ {{ it.likes ?? 0 }}</span>
                  </div>
                </a>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ContentDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly formatContentSubjects = formatContentSubjects;
  readonly formatContentGradeLevels = formatContentGradeLevels;

  readonly content = signal<ContentDetail | null>(null);
  readonly notFound = signal(false);
  readonly comments = signal<Comment[]>([]);
  readonly similar = signal<ContentDetail[]>([]);
  readonly busy = signal(false);
  newComment = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const slug = p.get('slug');
      if (!slug) return;
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const path = isGuid ? `/contents/${slug}` : `/search/contents/${slug}`;
      this.notFound.set(false);
      this.api.get<ContentDetail>(path).subscribe({
        next: (data) => { this.content.set(data); this.loadComments(data.id); this.loadSimilar(data.id); },
        error: () => this.notFound.set(true),
      });
    });
  }

  private loadComments(id: string): void {
    this.api.get<Comment[]>(`/contents/${id}/comments`).subscribe({ next: (data) => this.comments.set(data) });
  }

  private loadSimilar(id: string): void {
    this.api.get<{ items: ContentDetail[] }>(`/search/contents/${id}/similar`).subscribe({
      next: (data) => this.similar.set(data.items || []),
    });
  }

  like(): void {
    const c = this.content();
    if (!c) return;
    this.api.post(`/contents/${c.id}/like`, {}).subscribe({
      next: () => this.content.set({ ...c, likes: (c.likes ?? 0) + 1 }),
    });
  }

  favorite(): void {
    const c = this.content();
    if (!c) return;
    this.api.post(`/contents/${c.id}/favorite`, {}).subscribe();
  }

  submitComment(): void {
    const c = this.content();
    if (!c || !this.newComment.trim()) return;
    this.busy.set(true);
    this.api.post<Comment>(`/contents/${c.id}/comments`, { body: this.newComment }).subscribe({
      next: (data) => { this.comments.set([data, ...this.comments()]); this.newComment = ''; this.busy.set(false); },
      error: () => this.busy.set(false),
    });
  }

  share(): void {
    const url = window.location.href;
    const title = this.content()?.title ?? '';
    if (navigator.share) navigator.share({ title, url }).catch(() => undefined);
    else navigator.clipboard.writeText(url).catch(() => undefined);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('tr-TR');
  }
}
