import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';
import { ContentState } from '@core/api/contracts';

interface ContentItem {
  id: string;
  title: string;
  state: ContentState;
  subject: string;
  gradeLevel: number;
  updatedAtUtc: string;
}

@Component({
  selector: 'da-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="p-8 text-dim">Yükleniyor...</div>
    } @else {
      <div class="max-w-6xl">
        <header class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-extrabold text-ink">Kontrol Paneli</h1>
            <p class="text-sm text-muted mt-1">İçeriklerinize ait güncel durum özeti.</p>
          </div>
          <a routerLink="/teacher/contents/new"
             class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20">
            <mat-icon style="font-size:20px;width:20px;height:20px">add_circle</mat-icon>
            Yeni İçerik Yükle
          </a>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-surface rounded-2xl border border-line/10 p-6 flex items-center gap-5 shadow-sm">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <mat-icon style="font-size:28px;width:28px;height:28px">check_circle</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-dim">Yayında</p>
              <p class="text-3xl font-extrabold text-ink mt-1">{{ publishedCount() }}</p>
            </div>
          </div>
          <div class="bg-surface rounded-2xl border border-line/10 p-6 flex items-center gap-5 shadow-sm">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <mat-icon style="font-size:28px;width:28px;height:28px">schedule</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-dim">İncelemede</p>
              <p class="text-3xl font-extrabold text-ink mt-1">{{ pendingCount() }}</p>
            </div>
          </div>
          <div class="bg-surface rounded-2xl border border-line/10 p-6 flex items-center gap-5 shadow-sm">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-panel text-muted">
              <mat-icon style="font-size:28px;width:28px;height:28px">description</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-dim">Taslak / Revizyon</p>
              <p class="text-3xl font-extrabold text-ink mt-1">{{ draftCount() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-line/10 flex items-center justify-between">
            <h2 class="font-semibold text-ink inline-flex items-center gap-2">
              <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">bar_chart</mat-icon>
              Son Yüklenenler
            </h2>
            <a routerLink="/teacher/contents" class="text-sm font-medium text-brand-600 hover:text-brand-700">Tümünü Gör →</a>
          </div>
          <div class="divide-y divide-line/10">
            @if (contents().length === 0) {
              <div class="p-8 text-center text-dim"><p>Henüz hiç içerik yüklemediniz.</p></div>
            } @else {
              @for (c of contents().slice(0, 5); track c.id) {
                <div class="px-6 py-4 flex items-center justify-between hover:bg-panel transition">
                  <div>
                    <h3 class="font-semibold text-ink">{{ c.title }}</h3>
                    <div class="text-xs text-dim mt-1 flex gap-2">
                      <span>{{ c.subject }}</span><span>•</span><span>{{ c.gradeLevel }}. Sınıf</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span [class]="badgeClass(c.state)">{{ c.state }}</span>
                    @if (isPublished(c.state)) {
                      <a [routerLink]="['/play', c.id]" class="text-dim hover:text-brand-600 transition">
                        <mat-icon style="font-size:24px;width:24px;height:24px">play_circle</mat-icon>
                      </a>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class TeacherDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly contents = signal<ContentItem[]>([]);
  readonly loading = signal(true);

  readonly publishedCount = computed(() => this.contents().filter((c) => this.isPublished(c.state)).length);
  readonly pendingCount = computed(() => this.contents().filter((c) => ['GuardScanning', 'Submitted', 'AIReviewing', 'AIReviewed', 'EditorReviewing'].includes(c.state)).length);
  readonly draftCount = computed(() => this.contents().filter((c) => ['Draft', 'RevisionRequested'].includes(c.state)).length);

  ngOnInit(): void {
    this.api.get<ContentItem[]>('/contents/mine').subscribe({
      next: (data) => { this.contents.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isPublished(s: ContentState): boolean { return s === 'Published' || s === 'Approved'; }

  badgeClass(state: ContentState): string {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium ';
    if (['Published', 'Approved'].includes(state)) return base + 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (['Draft', 'RevisionRequested'].includes(state)) return base + 'bg-panel text-muted border border-line/10';
    return base + 'bg-amber-50 text-amber-700 border border-amber-200';
  }
}
