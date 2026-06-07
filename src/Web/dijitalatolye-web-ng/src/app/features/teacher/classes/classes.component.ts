import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface ClassRow {
  id: string;
  name: string;
  createdAtUtc: string;
  memberCount: number;
}

@Component({
  selector: 'da-teacher-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl">
      <header class="mb-8">
        <h1 class="text-2xl font-extrabold text-ink">Sınıflarım</h1>
        <p class="text-sm text-muted mt-1">Sınıf oluştur, öğrenci ekle, ödev ata.</p>
      </header>

      <div class="bg-surface rounded-2xl border border-line/10 p-6 shadow-sm mb-8">
        <h2 class="font-semibold text-ink mb-3 inline-flex items-center gap-2">
          <mat-icon class="!text-brand-600" style="font-size:20px;width:20px;height:20px">group_add</mat-icon>
          Yeni sınıf
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <input type="text" [(ngModel)]="newName" name="name" maxlength="160" placeholder="Sınıf adı (örn. 9-A Matematik)"
            class="rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm text-ink w-72" />
          <button type="button" (click)="create()" [disabled]="!newName.trim() || creating()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50">
            Oluştur
          </button>
        </div>
      </div>

      <div class="bg-surface rounded-2xl border border-line/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-line/10"><h2 class="font-semibold text-ink">Sınıflar</h2></div>
        @if (loading()) {
          <div class="p-8 text-dim">Yükleniyor…</div>
        } @else if (classes().length === 0) {
          <div class="p-8 text-center text-dim"><p>Henüz sınıf oluşturmadınız.</p></div>
        } @else {
          <div class="divide-y divide-line/10">
            @for (c of classes(); track c.id) {
              <a [routerLink]="['/teacher/classes', c.id]" class="px-6 py-4 flex items-center justify-between hover:bg-panel transition">
                <div>
                  <h3 class="font-semibold text-ink">{{ c.name }}</h3>
                  <p class="text-xs text-dim mt-1">{{ c.memberCount }} öğrenci</p>
                </div>
                <mat-icon class="text-dim" style="font-size:20px;width:20px;height:20px">chevron_right</mat-icon>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class TeacherClassesComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly classes = signal<ClassRow[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  newName = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.api.get<ClassRow[]>('/classes/mine').subscribe({
      next: (data) => { this.classes.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.creating.set(true);
    this.api.post('/classes', { name }).subscribe({
      next: () => { this.creating.set(false); this.newName = ''; this.load(); },
      error: () => this.creating.set(false),
    });
  }
}
