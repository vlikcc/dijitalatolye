import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';
import { ContentType } from '@core/api/contracts';

/** Tür → sayfa metinleri. type yoksa (tüm türler) genel "Keşfet" gösterilir. */
const TYPE_META: Record<ContentType, { eyebrow: string; subtitle: string }> = {
  Game: { eyebrow: 'Oyunlar', subtitle: 'Editör onaylı, güvenli ve kazanım odaklı eğitsel oyunlar.' },
  DigitalContent: { eyebrow: 'Dijital İçerikler', subtitle: 'Kazanım-tabanlı, editör onaylı dijital öğrenme içerikleri.' },
  EBook: { eyebrow: 'e-Kitaplar', subtitle: 'Editör onaylı e-kitaplar; bir kısmı kazanım odaklıdır.' },
};

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  slug: string;
  subject?: string;
  gradeLevel?: number;
  tags?: string[];
  views?: number;
  likes?: number;
}

interface SearchResponse {
  items: SearchItem[];
  total: number;
  facets: Record<string, Array<{ key: string; count: number }>>;
}

@Component({
  selector: 'da-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="da-science-bg min-h-screen">
      <div class="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div class="da-eyebrow mb-3">[ {{ eyebrow() }} ] Keşfet</div>
        <h1 class="da-display text-4xl md:text-5xl font-bold text-ink">
          İlgini çeken <span class="da-serif text-accent">içeriği</span> bul.
        </h1>
        <p class="mt-2 text-muted max-w-xl">{{ subtitle() }}</p>
      </div>

      <div class="max-w-7xl mx-auto px-4 pb-16 flex flex-col md:flex-row gap-8">
        <aside class="w-full md:w-64 shrink-0">
          <div class="bg-surface border border-line/10 rounded-2xl p-5 space-y-6 md:sticky md:top-24">
            <div class="font-mono text-[11px] tracking-widest uppercase text-dim">Filtreler</div>
            <div>
              <h3 class="font-display font-semibold mb-3 text-sm text-ink">Dersler</h3>
              <ul class="space-y-1.5 text-sm">
                @for (f of facets()['subjects'] || []; track f.key) {
                  <li>
                    <label class="flex items-center gap-2 cursor-pointer text-muted hover:text-ink transition">
                      <input type="radio" name="subject" class="accent-accent" [checked]="subject() === f.key" (change)="setFilter('subject', f.key)" />
                      <span class="flex-1 truncate">{{ f.key }}</span>
                      <span class="text-dim font-mono text-xs">{{ f.count }}</span>
                    </label>
                  </li>
                }
                @if (subject()) {
                  <li><button (click)="setFilter('subject', null)" class="text-accent2 text-xs mt-1 hover:underline">Seçimi temizle</button></li>
                }
              </ul>
            </div>
            <div>
              <h3 class="font-display font-semibold mb-3 text-sm text-ink">Sınıf Seviyesi</h3>
              <ul class="space-y-1.5 text-sm">
                @for (f of facets()['gradeLevels'] || []; track f.key) {
                  <li>
                    <label class="flex items-center gap-2 cursor-pointer text-muted hover:text-ink transition">
                      <input type="radio" name="grade" class="accent-accent" [checked]="grade() === f.key" (change)="setFilter('grade', f.key)" />
                      <span class="flex-1 truncate">{{ f.key }}. Sınıf</span>
                      <span class="text-dim font-mono text-xs">{{ f.count }}</span>
                    </label>
                  </li>
                }
                @if (grade()) {
                  <li><button (click)="setFilter('grade', null)" class="text-accent2 text-xs mt-1 hover:underline">Seçimi temizle</button></li>
                }
              </ul>
            </div>
            <div>
              <h3 class="font-display font-semibold mb-3 text-sm text-ink">Popüler Etiketler</h3>
              <div class="flex flex-wrap gap-1.5">
                @for (f of (facets()['tags'] || []).slice(0, 15); track f.key) {
                  <button (click)="toggleTag(f.key)"
                    [class]="tag() === f.key
                      ? 'text-xs px-2.5 py-1 rounded-full bg-accent text-white'
                      : 'text-xs px-2.5 py-1 rounded-full bg-panel text-muted border border-line/10 hover:border-accent/40 hover:text-accent transition'">
                    {{ f.key }}
                  </button>
                }
              </div>
            </div>
          </div>
        </aside>

        <section class="flex-1">
          @if (outcome()) {
            <div class="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm">
              <mat-icon style="font-size:16px;width:16px;height:16px">school</mat-icon>
              <span>Kazanım: <span class="font-mono">{{ outcome() }}</span></span>
              <button type="button" (click)="setFilter('outcome', null)" class="ml-1 hover:text-accent2" aria-label="Kazanım filtresini temizle">
                <mat-icon style="font-size:16px;width:16px;height:16px">close</mat-icon>
              </button>
            </div>
          }
          <div class="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <p class="font-mono text-[11px] tracking-widest uppercase text-dim">{{ total() }} sonuç</p>
            <div class="relative w-full sm:w-80">
              <mat-icon class="!text-dim absolute left-3 top-1/2 -translate-y-1/2" style="font-size:18px;width:18px;height:18px">search</mat-icon>
              <input class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-line/15 bg-surface text-ink placeholder:text-dim focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
                placeholder="Oyun veya içerik ara…" [value]="q()" (keydown.enter)="onSearch($event)" />
            </div>
          </div>

          @if (loading()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="rounded-2xl border border-line/10 bg-surface overflow-hidden animate-pulse">
                  <div class="h-36 bg-panel"></div>
                  <div class="p-4 space-y-3"><div class="h-4 bg-panel rounded w-3/4"></div><div class="h-3 bg-panel rounded w-1/2"></div></div>
                </div>
              }
            </div>
          } @else if (!items().length) {
            <div class="text-center py-20">
              <mat-icon class="!text-dim" style="font-size:48px;width:48px;height:48px">search_off</mat-icon>
              <p class="mt-3 text-muted">Sonuç bulunamadı. Filtreleri değiştirip tekrar dene.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (it of items(); track it.id; let i = $index) {
                <a [routerLink]="['/play', it.slug]" class="group rounded-2xl overflow-hidden border border-line/10 bg-surface hover:-translate-y-1 hover:shadow-glow transition-all duration-300">
                  <div class="relative h-36 overflow-hidden" [style.background]="gradientFor(i)">
                    <div class="absolute inset-0 bg-grid-line opacity-30" style="background-size:20px 20px"></div>
                    <mat-icon class="!text-white/90 absolute top-3.5 left-3.5" style="font-size:28px;width:28px;height:28px">{{ iconFor(i) }}</mat-icon>
                    <span class="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-full bg-black/25 backdrop-blur text-white text-[10px] font-mono tracking-wider uppercase">{{ it.subject || 'Genel' }}</span>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span class="w-12 h-12 rounded-full bg-white/95 text-accent inline-flex items-center justify-center shadow-xl">
                        <mat-icon style="font-size:26px;width:26px;height:26px">play_arrow</mat-icon>
                      </span>
                    </div>
                  </div>
                  <div class="p-4">
                    <h3 class="font-display font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent transition">{{ it.title }}</h3>
                    @if (it.description) {
                      <p class="text-sm text-muted mt-1.5 line-clamp-2">{{ it.description }}</p>
                    }
                    <div class="mt-3 flex items-center justify-between font-mono text-[11px] tracking-wider uppercase text-dim">
                      <span>{{ it.gradeLevel ? it.gradeLevel + '. Sınıf' : 'Tüm Seviyeler' }}</span>
                      <span class="inline-flex items-center gap-2">
                        <span class="inline-flex items-center gap-1"><mat-icon style="font-size:13px;width:13px;height:13px">visibility</mat-icon>{{ it.views ?? 0 }}</span>
                        <span class="inline-flex items-center gap-1 text-accent2"><mat-icon style="font-size:13px;width:13px;height:13px">favorite</mat-icon>{{ it.likes ?? 0 }}</span>
                      </span>
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class DiscoverComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly q = signal('');
  readonly contentType = signal<ContentType | null>(null);
  readonly eyebrow = computed(() => {
    const t = this.contentType();
    return t ? TYPE_META[t].eyebrow : 'Tüm İçerikler';
  });
  readonly subtitle = computed(() => {
    const t = this.contentType();
    return t ? TYPE_META[t].subtitle : 'Editör onaylı, güvenli ve kazanım odaklı eğitsel içerikler.';
  });
  readonly subject = signal<string | null>(null);
  readonly grade = signal<string | null>(null);
  readonly tag = signal<string | null>(null);
  readonly outcome = signal<string | null>(null);
  readonly items = signal<SearchItem[]>([]);
  readonly facets = signal<Record<string, Array<{ key: string; count: number }>>>({});
  readonly total = signal(0);
  readonly loading = signal(false);

  private readonly gradients = [
    'linear-gradient(135deg,#0b5f8c,#5a3fcb)',
    'linear-gradient(135deg,#5a3fcb,#8b6bf0)',
    'linear-gradient(135deg,#0cb5db,#0b5f8c)',
    'linear-gradient(135deg,#1a72a3,#0cb5db)',
    'linear-gradient(135deg,#b57f1f,#d6a52f)',
    'linear-gradient(135deg,#4a32a8,#5a3fcb)',
  ];
  private readonly icons = ['extension', 'casino', 'rocket_launch', 'psychology', 'lightbulb', 'emoji_objects', 'auto_awesome', 'science'];

  gradientFor(i: number): string { return this.gradients[i % this.gradients.length]; }
  iconFor(i: number): string { return this.icons[i % this.icons.length]; }

  ngOnInit(): void {
    // Tür route data'dan gelir (/games, /digital, /ebooks); yoksa tüm türler (/discover).
    this.contentType.set((this.route.snapshot.data['type'] as ContentType) ?? null);
    this.route.queryParamMap.subscribe((p) => {
      this.q.set(p.get('q') ?? '');
      this.subject.set(p.get('subject'));
      this.grade.set(p.get('grade'));
      this.tag.set(p.get('tag'));
      this.outcome.set(p.get('outcome'));
      this.fetch();
    });
  }

  setFilter(name: 'subject' | 'grade' | 'tag' | 'outcome', value: string | null): void {
    const qp = { ...this.route.snapshot.queryParams, [name]: value ?? undefined };
    this.router.navigate([], { queryParams: qp });
  }

  toggleTag(t: string): void {
    this.setFilter('tag', this.tag() === t ? null : t);
  }

  onSearch(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.router.navigate([], { queryParams: { ...this.route.snapshot.queryParams, q: v || undefined } });
  }

  private fetch(): void {
    this.loading.set(true);
    this.api.get<SearchResponse>('/search/contents', {
      q: this.q() || undefined,
      type: this.contentType() || undefined,
      subject: this.subject() || undefined,
      gradeLevel: this.grade() || undefined,
      tag: this.tag() || undefined,
      outcome: this.outcome() || undefined,
      page: 1,
      pageSize: 24,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items ?? []);
        this.total.set(data.total ?? 0);
        this.facets.set(data.facets ?? {});
        this.loading.set(false);
      },
      error: () => { this.items.set([]); this.loading.set(false); },
    });
  }
}
