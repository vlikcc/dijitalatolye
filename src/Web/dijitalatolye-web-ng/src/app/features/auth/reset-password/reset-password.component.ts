import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';

@Component({
  selector: 'da-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden="true"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl" aria-hidden="true"></div>

      <div class="relative w-full max-w-md">
        <div class="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div class="flex items-center gap-2 mb-6">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <mat-icon class="!text-white" style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon>
            </span>
            <span class="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900">Yeni şifre belirleyin</h1>
          <p class="mt-1 text-sm text-slate-600">Hesap güvenliği için en az 8 karakterli bir şifre seçin.</p>

          @if (!hasParams()) {
            <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Bağlantı eksik veya geçersiz. Lütfen e-postadaki sıfırlama bağlantısının tamamını kullanın.
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
            <label class="block">
              <span class="text-xs font-semibold text-slate-700">Yeni şifre</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" style="font-size:16px;width:16px;height:16px">lock</mat-icon>
                <input type="password" required minlength="8" [(ngModel)]="password" name="password" autocomplete="new-password" placeholder="••••••••"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-slate-700">Yeni şifre (tekrar)</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" style="font-size:16px;width:16px;height:16px">lock</mat-icon>
                <input type="password" required minlength="8" [(ngModel)]="confirm" name="confirm" autocomplete="new-password" placeholder="••••••••"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
            </label>

            @if (error()) {
              <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</div>
            }

            <button type="submit" [disabled]="loading() || !hasParams()"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
              @if (loading()) { <mat-spinner diameter="16"></mat-spinner> }
              @else { <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon> }
              {{ loading() ? 'Kaydediliyor...' : 'Şifreyi değiştir' }}
            </button>
          </form>

          <p class="mt-6 text-sm text-center text-slate-600">
            <a routerLink="/login" class="font-semibold text-brand-700 hover:text-brand-800">Girişe dön</a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class ResetPasswordComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  password = '';
  confirm = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasParams = computed(() => {
    const qp = this.route.snapshot.queryParamMap;
    return !!qp.get('token') && !!qp.get('email');
  });

  onSubmit(): void {
    this.error.set(null);
    if (this.password.length < 8) { this.error.set('Şifre en az 8 karakter olmalı.'); return; }
    if (this.password !== this.confirm) { this.error.set('Şifreler eşleşmiyor.'); return; }

    const email = this.route.snapshot.queryParamMap.get('email')!;
    const token = this.route.snapshot.queryParamMap.get('token')!;

    this.loading.set(true);
    this.api.post('/auth/reset-password', { email, token, newPassword: this.password }).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { reset: '1' } }),
      error: (err) => {
        const r = (err as { error?: { detail?: string; title?: string } })?.error;
        this.error.set(r?.detail ?? r?.title ?? 'Sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
