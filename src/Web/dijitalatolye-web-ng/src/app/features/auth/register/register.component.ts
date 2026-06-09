import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';

@Component({
  selector: 'da-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div class="absolute inset-0 da-dream-bg" aria-hidden="true"></div>
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden="true"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl" aria-hidden="true"></div>

      <div class="relative w-full max-w-md">
        <div class="rounded-2xl border border-line/15 bg-surface shadow-xl shadow-brand-900/5 p-8">
          <div class="flex items-center gap-2 mb-6">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg da-grad text-white">
              <mat-icon class="!text-white" style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon>
            </span>
            <span class="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 class="text-2xl font-extrabold text-ink">Ücretsiz hesap oluşturun</h1>
          <p class="mt-1 text-sm text-muted">5 dakikada kayıt olun, ilk içeriğinizi yayına hazırlayın.</p>

          <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
            <label class="block">
              <span class="text-xs font-semibold text-muted">Görünen ad</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-dim" style="font-size:16px;width:16px;height:16px">person</mat-icon>
                <input type="text" required [(ngModel)]="displayName" name="displayName" placeholder="Ayşe Yılmaz" autocomplete="name"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line/15 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-muted">E-posta</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-dim" style="font-size:16px;width:16px;height:16px">mail</mat-icon>
                <input type="email" required [(ngModel)]="email" name="email" placeholder="ornek@meb.gov.tr" autocomplete="email"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line/15 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-muted">Şifre</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-dim" style="font-size:16px;width:16px;height:16px">lock</mat-icon>
                <input type="password" required [(ngModel)]="password" name="password" placeholder="En az 8 karakter" autocomplete="new-password"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line/15 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
              @if (password.length > 0) {
                <p [class]="passwordValid() ? 'mt-1 text-xs inline-flex items-center gap-1 text-emerald-700' : 'mt-1 text-xs inline-flex items-center gap-1 text-dim'">
                  <mat-icon style="font-size:14px;width:14px;height:14px">check_circle</mat-icon> En az 8 karakter
                </p>
              }
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-muted">Rol</span>
              <select [(ngModel)]="role" name="role"
                class="mt-1 w-full px-3 py-2.5 rounded-lg border border-line/15 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition">
                <option value="Teacher">Öğretmen</option>
                <option value="Student">Öğrenci</option>
              </select>
            </label>

            @if (error()) {
              <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</div>
            }
            <p class="text-xs text-dim">
              Kayıt olarak <a routerLink="/kvkk" class="text-brand-700 hover:text-brand-800 underline">KVKK aydınlatma metnini</a> okuduğunuzu kabul edersiniz.
            </p>

            <button type="submit" [disabled]="loading()"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
              @if (loading()) {
                <mat-spinner diameter="16" color="accent"></mat-spinner>
              } @else {
                <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
              }
              {{ loading() ? 'Hesap oluşturuluyor...' : 'Kayıt Ol' }}
            </button>
          </form>

          <p class="mt-6 text-sm text-center text-muted">
            Zaten hesabınız var mı? <a routerLink="/login" class="font-semibold text-brand-700 hover:text-brand-800">Giriş yapın</a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  email = '';
  displayName = '';
  password = '';
  role = 'Teacher';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordValid = computed(() => this.password.length >= 8);

  onSubmit(): void {
    if (!this.passwordValid()) { this.error.set('Şifre en az 8 karakter olmalı.'); return; }
    this.loading.set(true);
    this.error.set(null);
    this.api.post('/auth/register', { email: this.email, displayName: this.displayName, password: this.password, role: this.role }).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { registered: '1' } }),
      error: (err) => {
        const r = (err as { error?: { detail?: string; title?: string; message?: string } })?.error;
        this.error.set(r?.detail ?? r?.title ?? r?.message ?? 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
