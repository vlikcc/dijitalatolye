import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api/api.service';

interface DashboardStats {
  totalContents: number;
  pendingReview: number;
  publishedToday: number;
  activeEditors: number;
  totalUsers: number;
  llmDailyCostUsd: number;
}

@Component({
  selector: 'da-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <p class="p-6">Yükleniyor…</p>
    } @else if (!stats()) {
      <p class="p-6">Veri yok.</p>
    } @else {
      <div class="max-w-6xl mx-auto p-6">
        <h1 class="text-3xl font-bold mb-6 text-slate-900">Yönetim Paneli</h1>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          @for (c of cards(); track c.label) {
            <div class="bg-white border border-slate-200 rounded-lg p-5">
              <p class="text-sm text-slate-500">{{ c.label }}</p>
              <p class="text-2xl font-bold mt-2 text-slate-900">{{ c.value }}</p>
            </div>
          }
        </div>

        <div class="grid md:grid-cols-2 gap-4 mt-8">
          <a routerLink="/admin/contents" class="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow transition"><span class="font-medium">İçerik Yönetimi</span></a>
          <a routerLink="/admin/users" class="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow transition"><span class="font-medium">Kullanıcılar</span></a>
          <a routerLink="/admin/catalog" class="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow transition"><span class="font-medium">Müfredat / Kazanım</span></a>
          <a routerLink="/admin/audit" class="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow transition"><span class="font-medium">Audit Log</span></a>
          <a routerLink="/admin/ai" class="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow transition"><span class="font-medium">AI Konfigürasyon</span></a>
          <a routerLink="/admin/reports" class="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow transition"><span class="font-medium">Raporlar</span></a>
        </div>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.get<DashboardStats>('/admin/dashboard').subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => {
        this.stats.set({ totalContents: 0, pendingReview: 0, publishedToday: 0, activeEditors: 0, totalUsers: 0, llmDailyCostUsd: 0 });
        this.loading.set(false);
      },
    });
  }

  cards(): { label: string; value: string | number }[] {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Toplam İçerik', value: s.totalContents },
      { label: 'İncelemede', value: s.pendingReview },
      { label: 'Bugün Yayınlanan', value: s.publishedToday },
      { label: 'Aktif Editör', value: s.activeEditors },
      { label: 'Kullanıcı', value: s.totalUsers },
      { label: 'AI Maliyeti (bugün)', value: `$${s.llmDailyCostUsd.toFixed(2)}` },
    ];
  }
}
