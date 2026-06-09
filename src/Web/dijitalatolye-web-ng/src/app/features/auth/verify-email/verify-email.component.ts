import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';

type Status = 'loading' | 'success' | 'error';

@Component({
  selector: 'da-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[60vh] flex items-center justify-center p-6">
      <div class="max-w-md w-full rounded-2xl border border-line/15 bg-surface shadow-xl shadow-brand-900/5 p-8 text-center">
        @switch (status()) {
          @case ('loading') {
            <mat-spinner diameter="48" class="mx-auto"></mat-spinner>
            <h1 class="mt-4 text-xl font-semibold text-ink">Doğrulanıyor...</h1>
            <p class="text-muted mt-2">E-posta adresiniz doğrulanıyor, lütfen bekleyin.</p>
          }
          @case ('success') {
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <mat-icon style="font-size:32px;width:32px;height:32px">check_circle</mat-icon>
            </div>
            <h1 class="text-xl font-semibold text-ink">Doğrulama Başarılı</h1>
            <p class="text-muted mt-2">{{ message() }}</p>
            <a routerLink="/login"
              class="inline-block mt-6 px-6 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20 transition">
              Giriş Yap
            </a>
          }
          @case ('error') {
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <mat-icon style="font-size:32px;width:32px;height:32px">cancel</mat-icon>
            </div>
            <h1 class="text-xl font-semibold text-ink">Doğrulama Başarısız</h1>
            <p class="text-muted mt-2">{{ message() }}</p>
            <a routerLink="/login"
              class="inline-block mt-6 px-6 py-2.5 rounded-xl text-muted border border-line/20 hover:bg-panel transition">
              Giriş Sayfasına Dön
            </a>
          }
        }
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly status = signal<Status>('loading');
  readonly message = signal<string>('');

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const token = qp.get('token');
    if (!email || !token) {
      this.status.set('error');
      this.message.set('Geçersiz doğrulama bağlantısı.');
      return;
    }
    this.api.post('/auth/verify-email', { email, token }).subscribe({
      next: () => { this.status.set('success'); this.message.set('E-posta adresiniz başarıyla doğrulandı!'); },
      error: (err) => {
        this.status.set('error');
        const r = (err as { error?: { detail?: string } })?.error;
        this.message.set(r?.detail ?? 'Doğrulama başarısız. Token geçersiz veya süresi dolmuş olabilir.');
      },
    });
  }
}
