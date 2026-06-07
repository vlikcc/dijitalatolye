import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface Member {
  studentEmail: string;
  joinedAtUtc: string;
  completedAtUtc: string | null;
  bestScore: number | null;
  completed: boolean;
}

interface AssignmentDetail {
  id: string;
  contentTitle: string;
  contentSlug: string | null;
  title: string;
  instructions: string | null;
  dueAtUtc: string | null;
  joinCode: string;
  status: string;
  createdAtUtc: string;
  members: Member[];
}

@Component({
  selector: 'da-teacher-assignment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/teacher/assignments" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-6">
      <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> Ödevlere dön
    </a>

    @if (loading()) {
      <div class="p-8 text-dim">Yükleniyor…</div>
    } @else if (!data()) {
      <div class="rounded-2xl bg-surface border border-rose-200 p-8 text-ink">Ödev bulunamadı.</div>
    } @else {
      <div class="max-w-4xl">
        <header class="rounded-2xl bg-surface border border-line/10 p-6 shadow-sm">
          <h1 class="text-2xl font-extrabold text-ink">{{ data()!.title }}</h1>
          <p class="text-sm text-muted mt-1">{{ data()!.contentTitle }}</p>
          @if (data()!.instructions) { <p class="mt-3 text-muted">{{ data()!.instructions }}</p> }
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xs text-dim">Katılım kodu:</span>
              <span class="font-mono text-lg font-bold px-3 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-200">{{ data()!.joinCode }}</span>
            </div>
            @if (data()!.dueAtUtc) { <span class="text-sm text-dim">Son tarih: {{ formatDate(data()!.dueAtUtc!) }}</span> }
            <span class="text-sm text-dim">{{ completedCount() }}/{{ data()!.members.length }} tamamladı</span>
          </div>
        </header>

        <div class="mt-6 bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-line/10">
            <h2 class="font-semibold text-ink">Katılımcılar</h2>
          </div>
          @if (data()!.members.length === 0) {
            <div class="p-8 text-center text-dim"><p>Henüz kimse katılmadı. Katılım kodunu öğrencilerinizle paylaşın.</p></div>
          } @else {
            <div class="divide-y divide-line/10">
              @for (m of data()!.members; track m.studentEmail) {
                <div class="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 class="font-medium text-ink">{{ m.studentEmail }}</h3>
                    <p class="text-xs text-dim mt-0.5">Katıldı: {{ formatDate(m.joinedAtUtc) }}</p>
                  </div>
                  <div class="flex items-center gap-4">
                    @if (m.completed) {
                      <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Tamamladı{{ m.bestScore != null ? ' · ' + m.bestScore + ' puan' : '' }}
                      </span>
                    } @else {
                      <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-panel text-muted border border-line/10">Bekliyor</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class TeacherAssignmentDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly data = signal<AssignmentDetail | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.api.get<AssignmentDetail>(`/assignments/${id}`).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  completedCount(): number {
    return this.data()?.members.filter((m) => m.completed).length ?? 0;
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
  }
}
