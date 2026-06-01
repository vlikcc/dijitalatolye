import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/api/api.service';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isVerified: boolean;
  mebVerified: boolean;
  createdAt: string;
}

type RoleFilter = 'all' | 'Teacher' | 'Editor' | 'Student';

@Component({
  selector: 'da-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <header class="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="text-3xl font-bold text-ink">Kullanıcılar</h1>
          <p class="text-sm text-dim mt-1">
            Toplam {{ counts().total }} · Öğretmen {{ counts().teacher }} · Editör {{ counts().editor }}.
            Editör ataması yalnızca kayıtlı öğretmenlere yapılabilir.
          </p>
        </div>
      </header>

      <div class="flex flex-wrap gap-3 mb-4">
        <input class="border border-line/10 rounded px-3 py-2 w-80" placeholder="E-posta veya isim..."
          [(ngModel)]="q" (ngModelChange)="reload()" />
        <select class="border border-line/10 rounded px-3 py-2" [(ngModel)]="roleFilter" (ngModelChange)="reload()">
          <option value="all">Tüm roller</option>
          <option value="Teacher">Öğretmenler</option>
          <option value="Editor">Editörler</option>
          <option value="Student">Öğrenciler</option>
        </select>
      </div>

      @if (error()) {
        <div class="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded mb-3 text-sm">{{ error() }}</div>
      }

      @if (loading()) {
        <p>Yükleniyor...</p>
      } @else {
        <div class="bg-surface border border-line/10 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-panel">
              <tr class="text-left">
                <th class="p-3">Ad</th>
                <th class="p-3">E-posta</th>
                <th class="p-3">Roller</th>
                <th class="p-3">Doğrulanmış</th>
                <th class="p-3">Kayıt</th>
                <th class="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr class="border-t border-line/10">
                  <td class="p-3">{{ u.displayName || '-' }}</td>
                  <td class="p-3">{{ u.email }}</td>
                  <td class="p-3 text-xs">
                    <div class="flex flex-wrap gap-1">
                      @for (r of u.roles; track r) {
                        <span [class]="roleBadge(r)">{{ r }}</span>
                      }
                    </div>
                  </td>
                  <td class="p-3">
                    {{ u.isVerified ? 'Evet' : 'Hayır' }}
                    @if (u.mebVerified) { <span class="ml-1 text-xs text-emerald-600">(MEB)</span> }
                  </td>
                  <td class="p-3 text-dim">{{ formatDate(u.createdAt) }}</td>
                  <td class="p-3 text-right">
                    @if (isAdmin(u)) { <span class="text-xs text-dim">—</span> }
                    @else if (canRevoke(u)) {
                      <button [disabled]="pendingId() === u.id" (click)="toggleEditor(u)"
                        class="px-3 py-1.5 rounded text-xs font-medium border bg-surface text-rose-700 border-rose-300 hover:bg-rose-50"
                        [class.opacity-50]="pendingId() === u.id" [class.cursor-wait]="pendingId() === u.id">
                        {{ pendingId() === u.id ? 'İşleniyor...' : 'Editör Yetkisini Al' }}
                      </button>
                    } @else if (canGrant(u)) {
                      <button [disabled]="pendingId() === u.id" (click)="toggleEditor(u)"
                        class="px-3 py-1.5 rounded text-xs font-medium border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                        [class.opacity-50]="pendingId() === u.id" [class.cursor-wait]="pendingId() === u.id">
                        {{ pendingId() === u.id ? 'İşleniyor...' : 'Editör Yap' }}
                      </button>
                    } @else {
                      <span class="text-xs text-dim" title="Editör yalnızca öğretmen hesaplarına atanır">—</span>
                    }
                  </td>
                </tr>
              }
              @if (users().length === 0) {
                <tr><td colspan="6" class="p-6 text-center text-dim">Kullanıcı bulunamadı.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly users = signal<UserRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pendingId = signal<string | null>(null);

  q = '';
  roleFilter: RoleFilter = 'all';

  readonly counts = computed(() => {
    const list = this.users();
    return {
      total: list.length,
      teacher: list.filter((u) => u.roles.includes('Teacher')).length,
      editor: list.filter((u) => u.roles.includes('Editor')).length,
    };
  });

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<UserRow[]>('/admin/users', {
      q: this.q.trim() || undefined,
      role: this.roleFilter !== 'all' ? this.roleFilter : undefined,
    }).subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: (e) => {
        this.users.set([]);
        const status = (e as { status?: number })?.status;
        this.error.set(status === 403 ? 'Bu sayfa için Admin yetkisi gerekli.' : 'Kullanıcılar yüklenemedi.');
        this.loading.set(false);
      },
    });
  }

  toggleEditor(u: UserRow): void {
    const isEditor = u.roles.includes('Editor');
    const action = isEditor ? 'revoke' : 'grant';
    const msg = isEditor
      ? `${u.email} kullanıcısının Editör yetkisini kaldırmak istediğinize emin misiniz?`
      : `${u.email} kullanıcısına Editör yetkisi vermek istediğinize emin misiniz?`;
    if (!confirm(msg)) return;
    this.pendingId.set(u.id);
    this.api.post(`/admin/users/${u.id}/roles/${action}`, { role: 'Editor' }).subscribe({
      next: () => { this.pendingId.set(null); this.reload(); },
      error: (e) => {
        const d = (e as { error?: { detail?: string; title?: string } })?.error;
        this.error.set(d?.detail ?? d?.title ?? 'İşlem başarısız.');
        this.pendingId.set(null);
      },
    });
  }

  isAdmin(u: UserRow): boolean { return u.roles.includes('Admin') || u.roles.includes('SuperAdmin'); }
  canGrant(u: UserRow): boolean { return !this.isAdmin(u) && u.roles.includes('Teacher') && !u.roles.includes('Editor'); }
  canRevoke(u: UserRow): boolean { return !this.isAdmin(u) && u.roles.includes('Editor'); }

  roleBadge(r: string): string {
    const base = 'px-2 py-0.5 rounded ';
    if (r === 'Editor') return base + 'bg-indigo-100 text-indigo-800';
    if (r === 'Admin' || r === 'SuperAdmin') return base + 'bg-amber-100 text-amber-800';
    if (r === 'Teacher') return base + 'bg-emerald-100 text-emerald-800';
    return base + 'bg-panel text-muted';
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleDateString('tr-TR'); }
}
