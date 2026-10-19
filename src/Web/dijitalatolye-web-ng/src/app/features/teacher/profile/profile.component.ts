import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';
import { AuthStore } from '@core/auth/auth.store';
import { StudioCredential, StudioService, studioErrorMessage } from '@core/api/studio.service';

@Component({
  selector: 'da-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl">
      <header class="mb-6">
        <h1 class="text-2xl font-extrabold text-ink">Profil</h1>
        <p class="text-sm text-muted mt-1">Hesap bilgileriniz ve öğretmen profiliniz.</p>
      </header>

      <div class="rounded-2xl bg-surface border border-line/10 p-6 mb-6">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-xl da-grad text-white flex items-center justify-center font-bold text-lg">
            {{ initial() }}
          </div>
          <div>
            <p class="text-sm text-dim inline-flex items-center gap-1.5">
              <mat-icon style="font-size:14px;width:14px;height:14px">mail</mat-icon> {{ email() }}
            </p>
            <p class="mt-1 text-sm text-dim inline-flex items-center gap-1.5">
              <mat-icon style="font-size:14px;width:14px;height:14px">verified_user</mat-icon> Roller: {{ rolesLabel() }}
            </p>
          </div>
        </div>
      </div>

      <form (ngSubmit)="onSubmit()" class="rounded-2xl bg-surface border border-line/10 p-6 space-y-4">
        <h2 class="font-semibold text-ink inline-flex items-center gap-2">
          <mat-icon class="!text-brand-600" style="font-size:16px;width:16px;height:16px">person</mat-icon> Öğretmen Bilgileri
        </h2>

        <label class="block">
          <span class="text-xs font-semibold text-muted">Görünen ad</span>
          <input [(ngModel)]="displayName" name="displayName" placeholder="Ayşe Yılmaz"
            class="mt-1 w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-muted">Okul / Kurum</span>
          <input [(ngModel)]="school" name="school" placeholder="Örn. Atatürk İlkokulu"
            class="mt-1 w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition" />
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-muted">Hakkında</span>
          <textarea [(ngModel)]="bio" name="bio" rows="4" placeholder="Branş, deneyim, ilgi alanları…"
            class="mt-1 w-full px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition resize-y"></textarea>
        </label>

        <div class="flex items-center justify-between pt-2">
          @if (saved()) { <span class="text-sm text-emerald-700">Kaydedildi ✓</span> }
          <button type="submit" [disabled]="saving()"
            class="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20 disabled:opacity-60">
            @if (saving()) { <mat-spinner diameter="16"></mat-spinner> }
            @else { <mat-icon style="font-size:16px;width:16px;height:16px">save</mat-icon> }
            Kaydet
          </button>
        </div>
      </form>

      <section class="rounded-2xl bg-surface border border-line/10 p-6 space-y-4 mt-6" aria-labelledby="evren-key-title">
        <div>
          <h2 id="evren-key-title" class="font-semibold text-ink inline-flex items-center gap-2">
            <mat-icon class="!text-brand-600" style="font-size:16px;width:16px;height:16px">key</mat-icon> Yapay Zekâ Anahtarım (EVREN)
          </h2>
          <p class="text-sm text-muted mt-1">
            AI Oyun Stüdyosu'nda platform anahtarı yerine kendi EVREN anahtarınızı kullanabilirsiniz; bu durumda platformun günlük
            üretim sınırı size uygulanmaz. Anahtar sunucuda şifreli saklanır ve size bir daha gösterilmez.
            <a href="https://evren.ssyz.org.tr/api-keys" target="_blank" rel="noopener" class="text-brand-700 underline">EVREN'den anahtar oluşturun ↗</a>
          </p>
        </div>

        @if (credential()?.hasKey) {
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/15 bg-bg px-3 py-2.5">
            <span class="text-sm text-ink">Kayıtlı anahtar: <span class="font-mono">••••{{ credential()!.last4 }}</span></span>
            <button type="button" (click)="removeKey()" [disabled]="keyBusy()"
              class="text-sm font-medium text-rose-700 hover:text-rose-800 disabled:opacity-50">Anahtarı sil</button>
          </div>
        }

        <div class="flex flex-col sm:flex-row gap-2">
          <label for="evren-key" class="sr-only">EVREN API anahtarı</label>
          <input id="evren-key" type="password" autocomplete="off" [(ngModel)]="apiKey" name="evrenKey"
            [placeholder]="credential()?.hasKey ? 'Yeni anahtarla değiştir' : 'evren_…'"
            class="flex-1 px-3 py-2.5 rounded-lg border border-line/10 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono text-sm" />
          <button type="button" (click)="saveKey()" [disabled]="keyBusy() || apiKey.trim().length < 8"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold disabled:opacity-60">
            @if (keyBusy()) { <mat-spinner diameter="16"></mat-spinner> }
            Doğrula ve kaydet
          </button>
        </div>
        @if (keyMessage()) {
          <p class="text-sm" [class]="keyError() ? 'text-rose-700' : 'text-emerald-700'" role="status">{{ keyMessage() }}</p>
        }
      </section>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly studio = inject(StudioService);

  readonly credential = signal<StudioCredential | null>(null);
  readonly keyBusy = signal(false);
  readonly keyMessage = signal<string | null>(null);
  readonly keyError = signal(false);
  apiKey = '';

  ngOnInit(): void {
    this.studio.credential().subscribe({ next: (c) => this.credential.set(c) });
  }

  saveKey(): void {
    const key = this.apiKey.trim();
    if (key.length < 8) return;
    this.keyBusy.set(true);
    this.keyMessage.set(null);
    this.studio.saveCredential(key).subscribe({
      next: (c) => {
        this.credential.set(c);
        this.apiKey = '';
        this.keyError.set(false);
        this.keyMessage.set('Anahtar doğrulandı ve kaydedildi.');
        this.keyBusy.set(false);
      },
      error: (e) => {
        this.keyError.set(true);
        this.keyMessage.set(studioErrorMessage(e, 'Anahtar kaydedilemedi.'));
        this.keyBusy.set(false);
      },
    });
  }

  removeKey(): void {
    if (!confirm('Kayıtlı EVREN anahtarınız silinsin mi?')) return;
    this.keyBusy.set(true);
    this.studio.deleteCredential().subscribe({
      next: () => {
        this.credential.set({ hasKey: false });
        this.keyError.set(false);
        this.keyMessage.set('Anahtar silindi.');
        this.keyBusy.set(false);
      },
      error: (e) => {
        this.keyError.set(true);
        this.keyMessage.set(studioErrorMessage(e, 'Anahtar silinemedi.'));
        this.keyBusy.set(false);
      },
    });
  }

  readonly email = this.auth.email;
  readonly roles = this.auth.roles;
  readonly initial = computed(() => (this.email() ?? '?').charAt(0).toUpperCase());
  readonly rolesLabel = computed(() => this.roles().join(', ') || '—');

  displayName = '';
  school = '';
  bio = '';
  readonly saving = signal(false);
  readonly saved = signal(false);

  onSubmit(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.api.put('/users/me', { displayName: this.displayName, schoolName: this.school, bio: this.bio }).subscribe({
      next: () => { this.saved.set(true); this.saving.set(false); setTimeout(() => this.saved.set(false), 2400); },
      error: () => this.saving.set(false),
    });
  }
}
