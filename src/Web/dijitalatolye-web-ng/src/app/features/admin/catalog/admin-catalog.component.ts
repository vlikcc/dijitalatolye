import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api/api.service';
import { forkJoin } from 'rxjs';
import { CatalogGrade, CatalogSubject } from '@core/api/contracts';

@Component({
  selector: 'da-admin-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Müfredat / Kazanım</h1>
        <a routerLink="/admin" class="text-sm text-brand-600 hover:underline">← Panele dön</a>
      </div>

      @if (loading()) {
        <p class="text-slate-500">Yükleniyor…</p>
      } @else {
        <div class="grid md:grid-cols-2 gap-6">
          <section class="bg-white border border-slate-200 rounded-lg p-5">
            <h2 class="font-semibold mb-3">Sınıflar ({{ grades().length }})</h2>
            @if (grades().length === 0) {
              <p class="text-slate-500 text-sm">Sınıf verisi bulunamadı.</p>
            } @else {
              <ul class="space-y-1 text-sm">
                @for (g of grades(); track g.id) {
                  <li class="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span class="font-medium">{{ g.name }}</span>
                    <span class="text-slate-500">{{ g.code }}</span>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="bg-white border border-slate-200 rounded-lg p-5">
            <h2 class="font-semibold mb-3">Dersler ({{ subjects().length }})</h2>
            @if (subjects().length === 0) {
              <p class="text-slate-500 text-sm">Ders verisi bulunamadı.</p>
            } @else {
              <ul class="space-y-1 text-sm">
                @for (s of subjects(); track s.id) {
                  <li class="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span class="font-medium">{{ s.name }}</span>
                    <span class="text-slate-500">{{ s.code }}</span>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      }
    </div>
  `,
})
export class AdminCatalogComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly grades = signal<CatalogGrade[]>([]);
  readonly subjects = signal<CatalogSubject[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      grades: this.api.get<CatalogGrade[]>('/catalog/grades'),
      subjects: this.api.get<CatalogSubject[]>('/catalog/subjects'),
    }).subscribe({
      next: ({ grades, subjects }) => { this.grades.set(grades); this.subjects.set(subjects); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
