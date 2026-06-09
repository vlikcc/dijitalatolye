import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
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
          @if (!editing()) {
            <div class="flex items-start justify-between gap-3">
              <div>
                <h1 class="text-2xl font-extrabold text-ink inline-flex items-center gap-2">
                  {{ data()!.title }}
                  <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full"
                    [class]="data()!.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-panel text-muted border border-line/20'">
                    {{ data()!.status === 'Active' ? 'Aktif' : 'Kapalı' }}
                  </span>
                </h1>
                <p class="text-sm text-muted mt-1">{{ data()!.contentTitle }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button type="button" (click)="startEdit()" title="Düzenle"
                  class="p-2 rounded-lg text-muted hover:text-brand-700 hover:bg-brand-50">
                  <mat-icon style="font-size:18px;width:18px;height:18px">edit</mat-icon>
                </button>
                <button type="button" (click)="remove()" [disabled]="busy()" title="Ödevi sil"
                  class="p-2 rounded-lg text-muted hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                  <mat-icon style="font-size:18px;width:18px;height:18px">delete</mat-icon>
                </button>
              </div>
            </div>
            @if (data()!.instructions) { <p class="mt-3 text-muted">{{ data()!.instructions }}</p> }
            <div class="mt-4 flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-xs text-dim">Katılım kodu:</span>
                <span class="font-mono text-lg font-bold px-3 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-200">{{ data()!.joinCode }}</span>
              </div>
              @if (data()!.dueAtUtc) { <span class="text-sm text-dim">Son tarih: {{ formatDate(data()!.dueAtUtc!) }}</span> }
              <span class="text-sm text-dim">{{ completedCount() }}/{{ data()!.members.length }} tamamladı</span>
            </div>
          } @else {
            <h2 class="font-semibold text-ink mb-3">Ödevi düzenle</h2>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-muted">Başlık</label>
                <input type="text" [(ngModel)]="editTitle" name="title" maxlength="200"
                  class="mt-1 w-full rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink" />
              </div>
              <div>
                <label class="text-xs font-semibold text-muted">Yönerge</label>
                <textarea [(ngModel)]="editInstructions" name="instr" rows="3" maxlength="2000"
                  class="mt-1 w-full rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink resize-y"></textarea>
              </div>
              <div class="flex flex-wrap gap-4">
                <div>
                  <label class="text-xs font-semibold text-muted">Son tarih</label>
                  <input type="date" [(ngModel)]="editDue" name="due"
                    class="mt-1 block rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-muted">Durum</label>
                  <select [(ngModel)]="editStatus" name="status"
                    class="mt-1 block rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink">
                    <option value="Active">Aktif</option>
                    <option value="Closed">Kapalı</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-2 pt-1">
                <button type="button" (click)="save()" [disabled]="busy() || !editTitle.trim()"
                  class="px-4 py-2 rounded-lg da-grad text-white text-sm font-semibold disabled:opacity-50">Kaydet</button>
                <button type="button" (click)="editing.set(false)" class="px-4 py-2 rounded-lg border border-line/20 text-muted text-sm hover:bg-bg">İptal</button>
              </div>
            </div>
          }
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
  private readonly router = inject(Router);

  readonly data = signal<AssignmentDetail | null>(null);
  readonly loading = signal(true);
  readonly editing = signal(false);
  readonly busy = signal(false);
  editTitle = '';
  editInstructions = '';
  editDue = '';
  editStatus = 'Active';

  ngOnInit(): void { this.load(); }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.api.get<AssignmentDetail>(`/assignments/${id}`).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startEdit(): void {
    const d = this.data();
    if (!d) return;
    this.editTitle = d.title;
    this.editInstructions = d.instructions ?? '';
    this.editDue = d.dueAtUtc ? d.dueAtUtc.slice(0, 10) : '';
    this.editStatus = d.status;
    this.editing.set(true);
  }

  save(): void {
    const d = this.data();
    if (!d || !this.editTitle.trim()) return;
    this.busy.set(true);
    const body = {
      title: this.editTitle.trim(),
      instructions: this.editInstructions.trim(),
      dueAtUtc: this.editDue ? new Date(this.editDue).toISOString() : null,
      status: this.editStatus,
    };
    this.api.put(`/assignments/${d.id}`, body).subscribe({
      next: () => { this.busy.set(false); this.editing.set(false); this.load(); },
      error: () => this.busy.set(false),
    });
  }

  remove(): void {
    const d = this.data();
    if (!d) return;
    if (!confirm(`"${d.title}" ödevi silinsin mi? (İçerik silinmez, yalnızca ödev kaldırılır.)`)) return;
    this.busy.set(true);
    this.api.delete(`/assignments/${d.id}`).subscribe({
      next: () => { this.busy.set(false); this.router.navigate(['/teacher/assignments']); },
      error: () => this.busy.set(false),
    });
  }

  completedCount(): number {
    return this.data()?.members.filter((m) => m.completed).length ?? 0;
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
  }
}
