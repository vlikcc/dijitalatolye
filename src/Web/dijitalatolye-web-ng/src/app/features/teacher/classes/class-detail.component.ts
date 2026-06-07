import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface Member { studentUserId: string; studentEmail: string; addedAtUtc: string; }
interface ClassDetail { id: string; name: string; createdAtUtc: string; members: Member[]; }
interface StudentResult { userId: string; email: string; displayName: string; }

@Component({
  selector: 'da-teacher-class-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/teacher/classes" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 mb-6">
      <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> Sınıflara dön
    </a>

    @if (loading()) {
      <div class="p-8 text-dim">Yükleniyor…</div>
    } @else if (!data()) {
      <div class="rounded-2xl bg-surface border border-rose-200 p-8 text-ink">Sınıf bulunamadı.</div>
    } @else {
      <div class="max-w-4xl">
        <header class="rounded-2xl bg-surface border border-line/10 p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-ink">{{ data()!.name }}</h1>
            <p class="text-sm text-muted mt-1">{{ data()!.members.length }} öğrenci</p>
          </div>
          <a [routerLink]="['/teacher/assignments']" [queryParams]="{ classId: data()!.id }"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700">
            <mat-icon style="font-size:18px;width:18px;height:18px">assignment_add</mat-icon> Ödev ata
          </a>
        </header>

        <div class="mt-6 bg-surface rounded-2xl border border-line/10 p-6 shadow-sm">
          <h2 class="font-semibold text-ink mb-3 inline-flex items-center gap-2">
            <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">person_add</mat-icon>
            Öğrenci ekle
          </h2>
          <input type="text" [(ngModel)]="query" (ngModelChange)="onQuery($event)" name="q"
            placeholder="E-posta veya ad ara (en az 2 karakter)…"
            class="w-full rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink" />
          @if (searching()) { <p class="text-xs text-dim mt-2">Aranıyor…</p> }
          @if (results().length) {
            <div class="mt-3 border border-line/10 rounded-xl divide-y divide-line/10 overflow-hidden">
              @for (s of results(); track s.userId) {
                <div class="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span class="font-medium text-ink">{{ s.displayName || s.email }}</span>
                    <span class="text-dim ml-2">{{ s.email }}</span>
                  </div>
                  @if (isMember(s.userId)) {
                    <span class="text-xs text-emerald-600">eklendi</span>
                  } @else {
                    <button type="button" (click)="add(s)" class="text-brand-600 hover:text-brand-700 text-sm font-medium">Ekle</button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="mt-6 bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-line/10"><h2 class="font-semibold text-ink">Öğrenciler</h2></div>
          @if (data()!.members.length === 0) {
            <div class="p-8 text-center text-dim"><p>Henüz öğrenci eklenmedi.</p></div>
          } @else {
            <div class="divide-y divide-line/10">
              @for (m of data()!.members; track m.studentUserId) {
                <div class="px-6 py-3 flex items-center justify-between gap-4">
                  <span class="text-sm text-ink">{{ m.studentEmail }}</span>
                  <button type="button" (click)="remove(m.studentUserId)" class="text-rose-600 hover:text-rose-700" aria-label="Çıkar">
                    <mat-icon style="font-size:18px;width:18px;height:18px">close</mat-icon>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class TeacherClassDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly data = signal<ClassDetail | null>(null);
  readonly loading = signal(true);
  readonly results = signal<StudentResult[]>([]);
  readonly searching = signal(false);
  query = '';
  private classId = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.classId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.classId) this.load();
    else this.loading.set(false);
  }

  private load(): void {
    this.api.get<ClassDetail>(`/classes/${this.classId}`).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onQuery(q: string): void {
    if (this.timer) clearTimeout(this.timer);
    const term = (q ?? '').trim();
    if (term.length < 2) { this.results.set([]); return; }
    this.searching.set(true);
    this.timer = setTimeout(() => {
      this.api.get<StudentResult[]>('/users/students', { q: term }).subscribe({
        next: (list) => { this.results.set(list ?? []); this.searching.set(false); },
        error: () => this.searching.set(false),
      });
    }, 300);
  }

  isMember(userId: string): boolean {
    return this.data()?.members.some((m) => m.studentUserId === userId) ?? false;
  }

  add(s: StudentResult): void {
    this.api.post<ClassDetail>(`/classes/${this.classId}/members`, { students: [{ userId: s.userId, email: s.email }] })
      .subscribe({ next: (d) => this.data.set(d) });
  }

  remove(studentUserId: string): void {
    this.api.delete(`/classes/${this.classId}/members/${studentUserId}`).subscribe({ next: () => this.load() });
  }
}
