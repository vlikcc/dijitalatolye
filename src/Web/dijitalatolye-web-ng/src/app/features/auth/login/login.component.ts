import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';
import { AuthStore } from '@core/auth/auth.store';
import { AuthTokens, LoginRequest } from '@core/api/contracts';

@Component({
  selector: 'da-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden="true"></div>
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden="true"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200/40 rounded-full blur-3xl" aria-hidden="true"></div>

      <div class="relative w-full max-w-md">
        <div class="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div class="flex items-center gap-2 mb-6">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <mat-icon class="!text-white" style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon>
            </span>
            <span class="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900">Tekrar hoş geldiniz</h1>
          <p class="mt-1 text-sm text-slate-600">Hesabınıza giriş yaparak içerik üretmeye devam edin.</p>

          <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
            <label class="block">
              <span class="text-xs font-semibold text-slate-700">E-posta</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" style="font-size:16px;width:16px;height:16px">mail</mat-icon>
                <input type="email" required [(ngModel)]="email" name="email" autocomplete="email" placeholder="ornek@meb.gov.tr"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-slate-700">Şifre</span>
              <div class="mt-1 relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" style="font-size:16px;width:16px;height:16px">lock</mat-icon>
                <input type="password" required [(ngModel)]="password" name="password" autocomplete="current-password" placeholder="••••••••"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
              </div>
            </label>

            <div class="flex items-center justify-between text-sm">
              <label class="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" class="rounded text-brand-600 focus:ring-brand-500" /> Beni hatırla
              </label>
              <a routerLink="/forgot-password" class="text-brand-700 hover:text-brand-800 font-medium">Şifremi unuttum</a>
            </div>

            @if (error()) {
              <div class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</div>
            }

            <button type="submit" [disabled]="loading()"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
              @if (loading()) {
                <mat-spinner diameter="16" color="accent"></mat-spinner>
              } @else {
                <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
              }
              {{ loading() ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
            </button>
          </form>

          <p class="mt-6 text-sm text-center text-slate-600">
            Hesabınız yok mu? <a routerLink="/register" class="font-semibold text-brand-700 hover:text-brand-800">Ücretsiz kayıt olun</a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);
    const body: LoginRequest = { email: this.email, password: this.password };
    this.api.post<AuthTokens>('/auth/login', body).subscribe({
      next: (data) => {
        this.auth.setTokens(data.accessToken, data.refreshToken);
        const roles = data.roles ?? rolesFromJwt(data.accessToken);
        this.auth.setUser(this.email, roles);
        if (roles.some((r) => ['Admin', 'SuperAdmin'].includes(r))) this.router.navigate(['/admin']);
        else if (roles.includes('Editor')) this.router.navigate(['/editor/queue']);
        else this.router.navigate(['/teacher/contents/new']);
      },
      error: (err) => {
        this.error.set(extractApiError(err) ?? 'Giriş başarısız. E-posta veya şifre hatalı olabilir.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}

function rolesFromJwt(token: string): string[] {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
    const claim = json.role ?? json.roles ?? [];
    return Array.isArray(claim) ? claim : [claim];
  } catch {
    return [];
  }
}

function extractApiError(err: unknown): string | null {
  const r = (err as { error?: { detail?: string; title?: string; message?: string } })?.error;
  return r?.detail ?? r?.title ?? r?.message ?? null;
}
