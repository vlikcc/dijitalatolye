import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';

interface AuditEntry {
  id: string;
  occurredAt: string;
  serviceName: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  severity: string;
  payloadJson?: string | null;
}

interface AuditList {
  total: number;
  page: number;
  pageSize: number;
  items: AuditEntry[];
}

@Component({
  selector: 'da-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6 text-ink">Audit Log</h1>

      <div class="flex gap-3 mb-4">
        <input class="border border-line/10 rounded px-3 py-2" placeholder="Eylem (ör. content.published)"
          [(ngModel)]="action" (ngModelChange)="reload(1)" />
        <select class="border border-line/10 rounded px-3 py-2" [(ngModel)]="severity" (ngModelChange)="reload(1)">
          <option value="">Tüm Seviyeler</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      @if (loading()) {
        <p>Yükleniyor...</p>
      } @else if (data()) {
        <div class="bg-surface border border-line/10 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-panel">
              <tr class="text-left">
                <th class="p-3">Zaman</th>
                <th class="p-3">Servis</th>
                <th class="p-3">Eylem</th>
                <th class="p-3">Kullanıcı</th>
                <th class="p-3">Entity</th>
                <th class="p-3">IP</th>
                <th class="p-3">Seviye</th>
              </tr>
            </thead>
            <tbody>
              @for (e of data()!.items; track e.id) {
                <tr class="border-t border-line/10">
                  <td class="p-3 whitespace-nowrap text-dim">{{ formatDate(e.occurredAt) }}</td>
                  <td class="p-3">{{ e.serviceName }}</td>
                  <td class="p-3 font-mono text-xs">{{ e.action }}</td>
                  <td class="p-3">{{ e.userName ?? (e.userId ? e.userId.slice(0, 8) : '-') }}</td>
                  <td class="p-3 text-xs">{{ e.entityType ? e.entityType + '/' + (e.entityId ? e.entityId.slice(0, 8) : '') : '-' }}</td>
                  <td class="p-3 text-xs">{{ e.ipAddress ?? '-' }}</td>
                  <td class="p-3">
                    <span [class]="severityClass(e.severity)">{{ e.severity }}</span>
                  </td>
                </tr>
              }
              @if (data()!.items.length === 0) {
                <tr><td colspan="7" class="p-6 text-center text-dim">Kayıt bulunamadı.</td></tr>
              }
            </tbody>
          </table>
          <div class="flex items-center justify-between p-3 border-t border-line/10 bg-panel text-sm">
            <span>Toplam: {{ data()!.total }} | Sayfa: {{ data()!.page }}</span>
            <div class="flex gap-2">
              <button class="px-3 py-1 border border-line/10 rounded disabled:opacity-50"
                (click)="reload(page() - 1)" [disabled]="page() === 1">Önceki</button>
              <button class="px-3 py-1 border border-line/10 rounded disabled:opacity-50"
                (click)="reload(page() + 1)" [disabled]="data()!.items.length < data()!.pageSize">Sonraki</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminAuditComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly data = signal<AuditList | null>(null);
  readonly loading = signal(true);
  readonly page = signal(1);
  action = '';
  severity = '';

  ngOnInit(): void { this.reload(1); }

  reload(p: number): void {
    if (p < 1) return;
    this.page.set(p);
    this.loading.set(true);
    this.api.get<AuditList>('/admin/audit', {
      page: p, pageSize: 50,
      action: this.action || undefined,
      severity: this.severity || undefined,
    }).subscribe({
      next: (data) => { this.data.set(data); this.loading.set(false); },
      error: () => { this.data.set({ total: 0, page: 1, pageSize: 50, items: [] }); this.loading.set(false); },
    });
  }

  severityClass(s: string): string {
    const base = 'px-2 py-0.5 rounded text-xs ';
    switch (s) {
      case 'Info': return base + 'bg-blue-50 text-blue-700';
      case 'Warning': return base + 'bg-amber-50 text-amber-700';
      case 'Error': return base + 'bg-rose-50 text-rose-700';
      case 'Critical': return base + 'bg-rose-100 text-rose-900';
      default: return base + 'bg-panel';
    }
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleString('tr-TR'); }
}
