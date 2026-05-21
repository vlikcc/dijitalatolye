import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';

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
    <div class="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-6">
      <aside class="w-full md:w-64 shrink-0">
        <h2 class="text-xl font-bold mb-4">Filtreler</h2>
        <div class="bg-white border border-slate-200 rounded-lg p-4 space-y-6">
          <div>
            <h3 class="font-semibold mb-2 text-sm">Dersler</h3>
            <ul class="space-y-1 text-sm">
              @for (f of facets()['subjects'] || []; track f.key) {
                <li>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="subject" [checked]="subject() === f.key" (change)="setFilter('subject', f.key)" />
                    <span class="flex-1 truncate">{{ f.key }}</span>
                    <span class="text-slate-400 text-xs">({{ f.count }})</span>
                  </label>
                </li>
              }
              @if (subject()) {
                <li><button (click)="setFilter('subject', null)" class="text-rose-600 text-xs mt-1">Seçimi Temizle</button></li>
              }
            </ul>
          </div>
          <div>
            <h3 class="font-semibold mb-2 text-sm">Sınıf Seviyesi</h3>
            <ul class="space-y-1 text-sm">
              @for (f of facets()['gradeLevels'] || []; track f.key) {
                <li>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="grade" [checked]="grade() === f.key" (change)="setFilter('grade', f.key)" />
                    <span class="flex-1 truncate">{{ f.key }}. Sınıf</span>
                    <span class="text-slate-400 text-xs">({{ f.count }})</span>
                  </label>
                </li>
              }
              @if (grade()) {
                <li><button (click)="setFilter('grade', null)" class="text-rose-600 text-xs mt-1">Seçimi Temizle</button></li>
              }
            </ul>
          </div>
          <div>
            <h3 class="font-semibold mb-2 text-sm">Popüler Etiketler</h3>
            <div class="flex flex-wrap gap-1">
              @for (f of (facets()['tags'] || []).slice(0, 15); track f.key) {
                <button (click)="toggleTag(f.key)"
                  [class]="tag() === f.key
                    ? 'text-xs px-2 py-1 rounded border bg-brand-600 text-white border-brand-600'
                    : 'text-xs px-2 py-1 rounded border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'">
                  {{ f.key }} ({{ f.count }})
                </button>
              }
            </div>
          </div>
        </div>
      </aside>

      <section class="flex-1">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-slate-900">İçerik Keşfi</h1>
          <div class="relative w-full sm:w-72">
            <input class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
              placeholder="Başlık veya açıklama ara…" [value]="q()" (keydown.enter)="onSearch($event)" />
          </div>
        </div>

        <p class="text-sm text-slate-500 mb-4">{{ total() }} sonuç bulundu</p>

        @if (loading()) {
          <p class="mt-6 text-slate-500">Yükleniyor…</p>
        } @else {
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (it of items(); track it.id) {
              <a [routerLink]="['/contents', it.slug]" class="border border-slate-200 rounded-lg p-4 hover:shadow transition bg-white">
                <div class="text-xs text-slate-500 mb-1">{{ it.subject }} {{ it.gradeLevel ? '· ' + it.gradeLevel + '. sınıf' : '' }}</div>
                <h3 class="font-semibold text-lg">{{ it.title }}</h3>
                @if (it.description) {
                  <p class="text-sm text-slate-600 mt-2 line-clamp-3">{{ it.description }}</p>
                }
                <div class="flex flex-wrap gap-1 mt-3">
                  @for (t of (it.tags || []).slice(0, 4); track t) {
                    <span class="text-xs bg-slate-100 rounded px-2 py-0.5">{{ t }}</span>
                  }
                </div>
                <div class="text-xs text-slate-500 mt-3 flex gap-3">
                  <span>👁 {{ it.views ?? 0 }}</span>
                  <span>♥ {{ it.likes ?? 0 }}</span>
                </div>
              </a>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class DiscoverComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly q = signal('');
  readonly subject = signal<string | null>(null);
  readonly grade = signal<string | null>(null);
  readonly tag = signal<string | null>(null);
  readonly items = signal<SearchItem[]>([]);
  readonly facets = signal<Record<string, Array<{ key: string; count: number }>>>({});
  readonly total = signal(0);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((p) => {
      this.q.set(p.get('q') ?? '');
      this.subject.set(p.get('subject'));
      this.grade.set(p.get('grade'));
      this.tag.set(p.get('tag'));
      this.fetch();
    });
  }

  setFilter(name: 'subject' | 'grade' | 'tag', value: string | null): void {
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
      subject: this.subject() || undefined,
      gradeLevel: this.grade() || undefined,
      tag: this.tag() || undefined,
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
