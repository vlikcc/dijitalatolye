import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';
import { formatContentGradeLevels } from '@core/api/contracts';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  slug: string;
  gradeLevels?: number[];
}

interface FacetBucket {
  value: string | number;
  count: number;
}

interface SearchResponse {
  total: number;
  items: SearchItem[];
  facets?: {
    subject?: FacetBucket[];
    gradeLevel?: FacetBucket[];
    tags?: FacetBucket[];
  };
}

@Component({
  selector: 'da-category',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <nav class="text-sm text-dim mb-4">
        <a routerLink="/discover" class="hover:text-brand-700">Keşfet</a>
        <span class="mx-2">/</span>
        <span class="text-ink">{{ subject() }}</span>
      </nav>

      <h1 class="text-3xl font-bold mb-2">{{ subject() }} içerikleri</h1>
      <p class="text-sm text-gray-500 mb-6">{{ total() }} sonuç</p>

      @if (gradeFacets().length > 0) {
        <div class="flex flex-wrap gap-2 mb-6">
          @for (b of gradeFacets(); track b.value) {
            <a [routerLink]="['/category', subject()]"
               [queryParams]="{ grade: isGradeSelected(b.value) ? null : b.value }"
               [class]="isGradeSelected(b.value)
                 ? 'text-sm px-3 py-1 rounded-full border da-grad text-white border-brand-600'
                 : 'text-sm px-3 py-1 rounded-full border bg-surface text-muted border-line/15 hover:border-brand-300'">
              {{ b.value }}. sınıf ({{ b.count }})
            </a>
          }
        </div>
      }

      @if (loading()) {
        <p class="text-dim">Yükleniyor…</p>
      } @else if (items().length === 0) {
        <p class="text-dim">Bu kategoride henüz içerik yok.</p>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of items(); track item.id) {
            <a [routerLink]="['/contents', item.slug]"
               class="block rounded-xl border border-line/15 bg-surface p-4 hover:border-brand-300 hover:shadow-md transition">
              <h2 class="font-semibold text-ink">{{ item.title }}</h2>
              @if (item.description) {
                <p class="text-sm text-muted mt-1 line-clamp-2">{{ item.description }}</p>
              }
              <p class="text-xs text-dim mt-2">
                {{ formatContentGradeLevels(item.gradeLevels) }}
              </p>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class CategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  readonly formatContentGradeLevels = formatContentGradeLevels;

  readonly subject = signal('');
  readonly grade = signal('');
  readonly items = signal<SearchItem[]>([]);
  readonly total = signal(0);
  readonly gradeFacets = signal<FacetBucket[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.subject.set(decodeURIComponent(params.get('subject') ?? ''));
      this.load();
    });
    this.route.queryParamMap.subscribe((params) => {
      this.grade.set(params.get('grade') ?? '');
      this.load();
    });
  }

  isGradeSelected(value: string | number): boolean {
    return this.grade() === String(value);
  }

  private load(): void {
    const subject = this.subject();
    if (!subject) return;
    this.loading.set(true);
    this.api.get<SearchResponse>('/search/contents', {
      subject,
      gradeLevel: this.grade() || undefined,
      page: 1,
      pageSize: 24,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items ?? []);
        this.total.set(data.total ?? 0);
        this.gradeFacets.set(data.facets?.gradeLevel ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
      },
    });
  }
}
