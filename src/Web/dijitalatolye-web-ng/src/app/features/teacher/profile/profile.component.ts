import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/api/api.service';
import { AuthStore } from '@core/auth/auth.store';

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
    </div>
  `,
})
export class ProfileComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);

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
