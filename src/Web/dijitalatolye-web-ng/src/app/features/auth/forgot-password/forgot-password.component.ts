import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';

@Component({
  selector: 'da-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden="true"></div>
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden="true"></div>

      <div class="relative w-full max-w-md">
        <div class="rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/5 p-8">
          <div class="flex items-center gap-2 mb-6">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <mat-icon class="!text-white" style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon>
            </span>
            <span class="text-sm font-semibold text-brand-700">DijitalAtölye</span>
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900">Şifremi unuttum</h1>
          <p class="mt-1 text-sm text-slate-600">E-posta adresinizi girin; sıfırlama bağlantısını gönderelim.</p>

          @if (sent()) {
            <div class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div class="flex items-center gap-2 font-semibold">
                <mat-icon style="font-size:16px;width:16px;height:16px">check_circle</mat-icon> E-posta yolda
              </div>
              <p class="mt-1.5 text-emerald-700">
                Eğer <strong>{{ email }}</strong> sistemimizde kayıtlıysa, sıfırlama bağlantısını dakikalar içinde alırsınız.
                Gelen kutusunu ve spam klasörünü kontrol edin.
              </p>
            </div>
          } @else {
            <form (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
              <label class="block">
                <span class="text-xs font-semibold text-slate-700">E-posta</span>
                <div class="mt-1 relative">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" style="font-size:16px;width:16px;height:16px">mail</mat-icon>
                  <input type="email" required [(ngModel)]="email" name="email" placeholder="ornek@meb.gov.tr"
                    class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
                </div>
              </label>

              <button type="submit" [disabled]="loading()"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-60 transition">
                @if (loading()) { <mat-spinner diameter="16"></mat-spinner> }
                @else { <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon> }
                {{ loading() ? 'Gönderiliyor...' : 'Sıfırlama bağlantısı gönder' }}
              </button>
            </form>
          }

          <p class="mt-6 text-sm text-center text-slate-600">
            <a routerLink="/login" class="font-semibold text-brand-700 hover:text-brand-800">Girişe dön</a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class ForgotPasswordComponent {
  private readonly api = inject(ApiService);

  email = '';
  readonly loading = signal(false);
  readonly sent = signal(false);

  onSubmit(): void {
    this.loading.set(true);
    // Hata olsa bile bilgi sızdırmamak için her durumda 'sent' state'e geçilir.
    this.api.post('/auth/forgot-password', { email: this.email }).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: () => { this.sent.set(true); this.loading.set(false); },
    });
  }
}
