import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '@core/api/api.service';

@Component({
  selector: 'da-account-delete',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-2">Hesap Silme Talebi</h1>
      <p class="text-gray-600 mb-6">
        KVKK kapsamında hesabınızın ve kişisel verilerinizin silinmesini talep edebilirsiniz.
        Talebiniz 30 gün içinde işleme alınır.
      </p>

      @if (done()) {
        <div class="p-4 bg-green-50 text-green-800 rounded-lg">
          Talebiniz alındı. E-posta adresinize onay gönderilecektir.
        </div>
      } @else {
        <button mat-flat-button color="warn" type="button" [disabled]="busy()" (click)="requestDelete()">
          {{ busy() ? 'Gönderiliyor…' : 'Hesap silme talebi gönder' }}
        </button>
      }

      @if (error()) {
        <p class="mt-4 text-red-700 text-sm">{{ error() }}</p>
      }

      <p class="mt-6 text-sm">
        <a routerLink="/kvkk" class="text-brand-600 hover:underline">← KVKK sayfasına dön</a>
      </p>
    </div>
  `,
})
export class AccountDeleteComponent {
  private readonly api = inject(ApiService);

  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  requestDelete(): void {
    if (!confirm('Hesap silme talebi gönderilecek. Devam edilsin mi?')) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.post('/users/me/kvkk/delete-request', {}).subscribe({
      next: () => { this.done.set(true); this.busy.set(false); },
      error: () => {
        this.error.set('Talep gönderilemedi. Giriş yaptığınızdan emin olun.');
        this.busy.set(false);
      },
    });
  }
}
