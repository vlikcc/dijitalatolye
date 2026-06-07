import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface AssignmentRow {
  id: string;
  contentTitle: string;
  title: string;
  dueAtUtc: string | null;
  joinCode: string;
  status: string;
  memberCount: number;
  completedCount: number;
}

interface MyContent {
  id: string;
  title: string;
  slug: string | null;
  state: string;
}

@Component({
  selector: 'da-teacher-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl">
      <header class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-ink">Ödevler</h1>
          <p class="text-sm text-muted mt-1">İçeriklerinizi öğrencilere atayın, katılım koduyla paylaşın.</p>
        </div>
      </header>

      <div class="bg-surface rounded-2xl border border-line/10 p-6 shadow-sm mb-8">
        <h2 class="font-semibold text-ink mb-4 inline-flex items-center gap-2">
          <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">add_task</mat-icon>
          Yeni ödev oluştur
        </h2>
        @if (publishedContents().length === 0) {
          <p class="text-sm text-dim">Atayabileceğiniz yayında içerik yok. Önce bir içerik yayınlayın.</p>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-medium text-dim">İçerik</span>
              <select [(ngModel)]="selectedContentId" name="content"
                class="mt-1 w-full rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink">
                <option value="">İçerik seçin…</option>
                @for (c of publishedContents(); track c.id) {
                  <option [value]="c.id">{{ c.title }}</option>
                }
              </select>
            </label>
            <label class="block">
              <span class="text-xs font-medium text-dim">Son tarih (opsiyonel)</span>
              <input type="date" [(ngModel)]="dueDate" name="due"
                class="mt-1 w-full rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink" />
            </label>
            <label class="block md:col-span-2">
              <span class="text-xs font-medium text-dim">Yönerge (opsiyonel)</span>
              <input type="text" [(ngModel)]="instructions" name="instr" maxlength="2000"
                placeholder="Öğrencilere not…"
                class="mt-1 w-full rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink" />
            </label>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <button type="button" (click)="create()" [disabled]="!selectedContentId || creating()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50">
              <mat-icon style="font-size:18px;width:18px;height:18px">check</mat-icon> Oluştur
            </button>
            @if (createError()) { <span class="text-sm text-rose-700">{{ createError() }}</span> }
          </div>
        }
      </div>

      <div class="bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-line/10">
          <h2 class="font-semibold text-ink">Ödevlerim</h2>
        </div>
        @if (loading()) {
          <div class="p-8 text-dim">Yükleniyor…</div>
        } @else if (assignments().length === 0) {
          <div class="p-8 text-center text-dim"><p>Henüz ödev oluşturmadınız.</p></div>
        } @else {
          <div class="divide-y divide-line/10">
            @for (a of assignments(); track a.id) {
              <a [routerLink]="['/teacher/assignments', a.id]" class="px-6 py-4 flex items-center justify-between hover:bg-panel transition">
                <div>
                  <h3 class="font-semibold text-ink">{{ a.title }}</h3>
                  <div class="text-xs text-dim mt-1 flex gap-2">
                    <span>{{ a.contentTitle }}</span>
                    @if (a.dueAtUtc) { <span>•</span><span>Son: {{ formatDate(a.dueAtUtc) }}</span> }
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="font-mono text-sm px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-200">{{ a.joinCode }}</span>
                  <span class="text-xs text-dim">{{ a.completedCount }}/{{ a.memberCount }} tamamladı</span>
                  <mat-icon class="text-dim" style="font-size:20px;width:20px;height:20px">chevron_right</mat-icon>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class TeacherAssignmentsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly assignments = signal<AssignmentRow[]>([]);
  readonly publishedContents = signal<MyContent[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);

  selectedContentId = '';
  dueDate = '';
  instructions = '';

  ngOnInit(): void {
    this.load();
    this.api.get<MyContent[]>('/contents/mine').subscribe({
      next: (items) => this.publishedContents.set((items ?? []).filter((c) => c.state === 'Published' || c.state === 'Approved')),
    });
  }

  private load(): void {
    this.api.get<AssignmentRow[]>('/assignments/mine').subscribe({
      next: (data) => { this.assignments.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const content = this.publishedContents().find((c) => c.id === this.selectedContentId);
    if (!content) return;
    this.creating.set(true);
    this.createError.set(null);
    this.api.post('/assignments', {
      contentId: content.id,
      contentTitle: content.title,
      contentSlug: content.slug,
      title: content.title,
      instructions: this.instructions || null,
      dueAtUtc: this.dueDate ? new Date(this.dueDate).toISOString() : null,
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.selectedContentId = ''; this.dueDate = ''; this.instructions = '';
        this.load();
      },
      error: () => { this.creating.set(false); this.createError.set('Ödev oluşturulamadı.'); },
    });
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
  }
}
