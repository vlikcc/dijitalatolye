import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface DashboardStats {
  pendingQueue: number;
  reviewedToday: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
}

@Component({
  selector: 'da-editor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6">
      <h1 class="text-2xl font-extrabold text-slate-900">Editör Paneli</h1>
      <p class="text-sm text-slate-600 mt-1">İnceleme bekleyen içerikler ve kişisel performansınız.</p>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="rounded-2xl bg-white border border-slate-200 p-5">
        <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-brand-50 text-brand-700">
          <mat-icon style="font-size:20px;width:20px;height:20px">schedule</mat-icon>
        </div>
        <div class="mt-3 text-2xl font-extrabold text-slate-900">{{ stats()?.pendingQueue ?? '—' }}</div>
        <div class="text-xs text-slate-500">Beklemede</div>
      </div>
      <div class="rounded-2xl bg-white border border-slate-200 p-5">
        <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-accent-50 text-accent-600">
          <mat-icon style="font-size:20px;width:20px;height:20px">rule</mat-icon>
        </div>
        <div class="mt-3 text-2xl font-extrabold text-slate-900">{{ stats()?.reviewedToday ?? '—' }}</div>
        <div class="text-xs text-slate-500">Bugün incelenen</div>
      </div>
      <div class="rounded-2xl bg-white border border-slate-200 p-5">
        <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-emerald-50 text-emerald-700">
          <mat-icon style="font-size:20px;width:20px;height:20px">check_circle</mat-icon>
        </div>
        <div class="mt-3 text-2xl font-extrabold text-slate-900">{{ stats()?.approvedThisWeek ?? '—' }}</div>
        <div class="text-xs text-slate-500">Onaylanan (hafta)</div>
      </div>
      <div class="rounded-2xl bg-white border border-slate-200 p-5">
        <div class="w-10 h-10 rounded-lg inline-flex items-center justify-center bg-rose-50 text-rose-700">
          <mat-icon style="font-size:20px;width:20px;height:20px">cancel</mat-icon>
        </div>
        <div class="mt-3 text-2xl font-extrabold text-slate-900">{{ stats()?.rejectedThisWeek ?? '—' }}</div>
        <div class="text-xs text-slate-500">Reddedilen (hafta)</div>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white p-8 shadow-lg shadow-brand-900/20">
      <h2 class="text-xl font-bold">İnceleme kuyruğuna git</h2>
      <p class="mt-2 text-white/90">AI tarafından ön incelemesi tamamlanan içerikleri görüp karar verin.</p>
      <a routerLink="/editor/queue"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50">
        Kuyruğu aç <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
      </a>
    </div>

    <div class="mt-8 grid md:grid-cols-2 gap-5">
      <a routerLink="/editor/history" class="group rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition">
        <div class="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-3 group-hover:bg-brand-600 group-hover:text-white transition">
          <mat-icon style="font-size:20px;width:20px;height:20px">rule</mat-icon>
        </div>
        <h3 class="font-semibold text-slate-900">Karar geçmişim</h3>
        <p class="mt-1 text-sm text-slate-600">Verdiğiniz tüm kararlar, gerekçeler ve yeniden inceleme talepleri.</p>
      </a>
    </div>
  `,
})
export class EditorDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.api.get<DashboardStats>('/review/dashboard').subscribe({ next: (data) => this.stats.set(data) });
  }
}
