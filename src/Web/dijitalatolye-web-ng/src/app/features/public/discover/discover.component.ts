import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';
import { ContentType, formatContentGradeLevels, formatContentSubjects } from '@core/api/contracts';

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
  subjects?: string[];
  gradeLevels?: number[];
  tags?: string[];
  views?: number;
  likes?: number;
}

type FilterName = 'subject' | 'grade' | 'tag' | 'outcome';
type FacetKey = 'subject' | 'gradeLevel' | 'tags' | 'outcome';

/** Filtre paneli bölümü: list = tekli seçim satırları, chips = sarmalanan çip butonlar. */
interface FilterSection {
  name: FilterName;
  facet: FacetKey;
  title: string;
  view: 'list' | 'chips';
  mono?: boolean;
  empty: string;
}

interface SearchResponse {
  items: SearchItem[];
  total: number;
  facets: Record<string, Array<{ value: string | number; count: number }>>;
}

@Component({
  selector: 'da-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="da-dream-bg min-h-screen">
      <div class="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div class="da-eyebrow mb-3">[ {{ eyebrow() }} ] Keşfet</div>
        <h1 class="da-display text-4xl md:text-5xl font-bold text-ink">
          İlgini çeken <span class="da-script da-rainbow-text">içeriği</span> bul.
        </h1>
        <p class="mt-2 text-muted max-w-xl">{{ subtitle() }}</p>
      </div>

      <div class="max-w-7xl mx-auto px-4 pb-16 flex flex-col md:flex-row gap-8">
        <aside class="w-full md:w-72 shrink-0">
          <!-- Not: Tailwind preflight kapalı; button/ul tarayıcı varsayılanları burada elle sıfırlanır. -->
          <div class="da-card overflow-hidden md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(var(--border)/0.18)_transparent]">
            <div class="flex items-center gap-2 px-4 py-3.5">
              <button type="button" (click)="filtersOpen.set(!filtersOpen())"
                class="flex-1 min-w-0 flex items-center gap-2.5 m-0 p-0 bg-transparent border-0 text-left font-sans text-ink cursor-pointer md:cursor-default"
                [attr.aria-expanded]="filtersOpen()" aria-controls="da-filter-body">
                <span class="w-8 h-8 rounded-xl bg-accent2/10 text-accent2 inline-flex items-center justify-center shrink-0">
                  <mat-icon style="font-size:18px;width:18px;height:18px">tune</mat-icon>
                </span>
                <span class="font-display font-semibold">Filtreler</span>
                @if (activeCount()) {
                  <span class="min-w-[20px] h-5 px-1.5 rounded-full da-grad text-[11px] font-semibold inline-flex items-center justify-center">{{ activeCount() }}</span>
                }
                <mat-icon class="md:!hidden ml-auto !text-dim transition-transform duration-200" [class.rotate-180]="filtersOpen()"
                  style="font-size:20px;width:20px;height:20px">expand_more</mat-icon>
              </button>
              @if (hasAnyFilter()) {
                <button type="button" (click)="clearAll()"
                  class="shrink-0 m-0 px-2.5 py-1 rounded-lg bg-transparent border-0 font-sans text-xs font-medium text-accent2 hover:bg-accent2/10 cursor-pointer transition">
                  Tümünü temizle
                </button>
              }
            </div>

            <div id="da-filter-body" class="md:block border-0 border-t border-solid border-line/10" [class.hidden]="!filtersOpen()">
              @for (s of sections; track s.name; let last = $last) {
                <div class="border-0 border-solid border-line/10" [class.border-b]="!last">
                  <button type="button" (click)="toggleSection(s.name)"
                    class="w-full flex items-center gap-2 m-0 px-4 py-3 bg-transparent border-0 text-left font-sans text-ink cursor-pointer hover:bg-panel/70 transition"
                    [attr.aria-expanded]="isOpen(s.name)">
                    <span class="font-display font-semibold text-sm shrink-0">{{ s.title }}</span>
                    @if (activeValue(s.name); as v) {
                      <span class="min-w-0 truncate px-2 py-0.5 rounded-full da-grad text-[10px] font-semibold" [class.font-mono]="s.mono">{{ optionLabel(s, v) }}</span>
                    }
                    <mat-icon class="ml-auto shrink-0 !text-dim transition-transform duration-200" [class.rotate-180]="isOpen(s.name)"
                      style="font-size:20px;width:20px;height:20px">expand_more</mat-icon>
                  </button>

                  @if (isOpen(s.name)) {
                    @if (s.view === 'list') {
                      <ul class="list-none m-0 px-2 pb-3 space-y-0.5 [scrollbar-width:thin]" [class.max-h-64]="s.mono" [class.overflow-y-auto]="s.mono">
                        @for (f of facetList(s.facet); track f.value) {
                          <li>
                            <button type="button" (click)="pick(s.name, f.value)" [attr.aria-pressed]="isActive(s.name, f.value)"
                              class="w-full flex items-center gap-2.5 m-0 px-2.5 py-2 rounded-xl border-0 text-left font-sans text-sm cursor-pointer transition"
                              [class]="isActive(s.name, f.value) ? 'bg-accent2/10 text-accent2 font-semibold' : 'bg-transparent text-muted hover:bg-panel hover:text-ink'">
                              <span class="w-4 h-4 rounded-full border-2 border-solid shrink-0 inline-flex items-center justify-center transition"
                                [class]="isActive(s.name, f.value) ? 'border-accent2' : 'border-line/25'">
                                @if (isActive(s.name, f.value)) { <span class="w-2 h-2 rounded-full bg-accent2"></span> }
                              </span>
                              <span class="flex-1 min-w-0 truncate" [class.font-mono]="s.mono" [class.text-xs]="s.mono">{{ optionLabel(s, f.value) }}</span>
                              <span class="shrink-0 min-w-[24px] px-1.5 py-px rounded-md text-center font-mono text-[11px] font-normal"
                                [class]="isActive(s.name, f.value) ? 'bg-accent2/15 text-accent2' : 'bg-panel text-dim'">{{ f.count }}</span>
                            </button>
                          </li>
                        } @empty {
                          <li class="px-2.5 py-1 text-xs text-dim">{{ s.empty }}</li>
                        }
                      </ul>
                    } @else {
                      <div class="px-4 pb-4 flex flex-wrap gap-1.5">
                        @for (f of facetList(s.facet); track f.value) {
                          <button type="button" (click)="pick(s.name, f.value)" [attr.aria-pressed]="isActive(s.name, f.value)"
                            class="inline-flex items-center gap-1.5 m-0 px-3 py-1.5 rounded-lg border border-solid font-sans text-xs font-medium cursor-pointer transition"
                            [class]="isActive(s.name, f.value) ? 'border-accent2/50 bg-accent2/10 text-accent2' : 'border-line/15 bg-bg text-muted hover:border-accent2/40 hover:text-ink'">
                            {{ optionLabel(s, f.value) }}
                            <span class="font-mono text-[10px] opacity-60">{{ f.count }}</span>
                          </button>
                        } @empty {
                          <span class="text-xs text-dim">{{ s.empty }}</span>
                        }
                      </div>
                    }
                  }
                </div>
              }
            </div>
          </div>
        </aside>

        <section class="flex-1">
          @if (outcome()) {
            <div class="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm">
              <mat-icon style="font-size:16px;width:16px;height:16px">school</mat-icon>
              <span>Kazanım: <span class="font-mono">{{ outcome() }}</span></span>
              <button type="button" (click)="setFilter('outcome', null)" class="ml-1 m-0 p-0 inline-flex bg-transparent border-0 text-inherit cursor-pointer hover:text-accent2" aria-label="Kazanım filtresini temizle">
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
                    <span class="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-full bg-black/25 backdrop-blur text-white text-[10px] font-mono tracking-wider uppercase">{{ formatContentSubjects(it.subjects) === '—' ? 'Genel' : formatContentSubjects(it.subjects) }}</span>
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
                      <span>{{ formatContentGradeLevels(it.gradeLevels) }}</span>
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

  readonly formatContentSubjects = formatContentSubjects;
  readonly formatContentGradeLevels = formatContentGradeLevels;

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
  readonly facets = signal<Record<string, Array<{ value: string | number; count: number }>>>({});
  readonly total = signal(0);
  readonly loading = signal(false);

  readonly sections: FilterSection[] = [
    { name: 'subject', facet: 'subject', title: 'Dersler', view: 'list', empty: 'Seçenek bulunamadı' },
    { name: 'grade', facet: 'gradeLevel', title: 'Sınıf Seviyesi', view: 'chips', empty: 'Seçenek bulunamadı' },
    { name: 'outcome', facet: 'outcome', title: 'Kazanımlar', view: 'list', mono: true, empty: 'Seçenek bulunamadı' },
    { name: 'tag', facet: 'tags', title: 'Etiketler', view: 'chips', empty: 'Etiket bulunamadı' },
  ];

  /** Mobilde filtre paneli varsayılan kapalı (md ve üstünde her zaman açık). */
  readonly filtersOpen = signal(false);
  readonly activeCount = computed(() => [this.subject(), this.grade(), this.tag(), this.outcome()].filter(Boolean).length);

  /** Açık/kapalı filtre bölümleri (accordion). Dersler varsayılan açık. */
  readonly openSections = signal<Record<string, boolean>>({ subject: true, grade: false, outcome: false, tag: false });

  isOpen(key: string): boolean { return !!this.openSections()[key]; }
  toggleSection(key: string): void {
    this.openSections.update((s) => ({ ...s, [key]: !s[key] }));
  }

  /** facets() içinden ilgili listeyi döndürür (backend anahtarları: subject/gradeLevel/tags/outcome). */
  facetList(key: FacetKey): Array<{ value: string | number; count: number }> {
    return this.facets()[key] ?? [];
  }

  activeValue(name: FilterName): string | null {
    return name === 'subject' ? this.subject()
      : name === 'grade' ? this.grade()
      : name === 'tag' ? this.tag()
      : this.outcome();
  }

  optionLabel(section: FilterSection, value: string | number): string {
    return section.name === 'grade' ? `${value}. Sınıf` : String(value);
  }

  isActive(name: FilterName, value: string | number): boolean {
    return this.activeValue(name) === String(value);
  }

  /** Bir değeri seçer; zaten seçiliyse kaldırır (kümülatif: diğer filtreler korunur). */
  pick(name: FilterName, value: string | number): void {
    const v = String(value);
    this.setFilter(name, this.isActive(name, value) ? null : v);
  }

  hasAnyFilter(): boolean {
    return !!(this.subject() || this.grade() || this.tag() || this.outcome());
  }

  clearAll(): void {
    const qp = { ...this.route.snapshot.queryParams, subject: undefined, grade: undefined, tag: undefined, outcome: undefined };
    this.router.navigate([], { queryParams: qp });
  }

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
      // Aktif filtresi olan bölümleri otomatik aç (kümülatif seçimde görünür kalsın).
      this.openSections.update((s) => ({
        subject: s['subject'] || !!this.subject(),
        grade: s['grade'] || !!this.grade(),
        outcome: s['outcome'] || !!this.outcome(),
        tag: s['tag'] || !!this.tag(),
      }));
      this.fetch();
    });
  }

  setFilter(name: FilterName, value: string | null): void {
    const qp = { ...this.route.snapshot.queryParams, [name]: value ?? undefined };
    this.router.navigate([], { queryParams: qp });
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
