import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

const STORAGE_KEY = 'dijitalatolye-cookie-consent';

@Component({
  selector: 'da-cookie-banner',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:max-w-md z-50">
        <div class="rounded-2xl bg-surface border border-brand-200 shadow-xl shadow-brand-900/10 p-5">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <mat-icon style="font-size:20px;width:20px;height:20px">cookie</mat-icon>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-ink text-sm">Çerez kullanımı</h3>
              <p class="mt-1 text-xs text-muted leading-relaxed">
                Hizmetimizi iyileştirmek için yalnızca gerekli teknik çerezleri kullanıyoruz.
                Detay için <a routerLink="/kvkk" class="text-brand-700 hover:text-brand-800 underline">KVKK</a> sayfamıza bakın.
              </p>
              <div class="mt-3 flex gap-2">
                <button (click)="accept()"
                  class="px-3 py-1.5 rounded-lg da-grad text-white text-xs font-semibold">Kabul ediyorum</button>
                <button (click)="dismiss()"
                  class="px-3 py-1.5 rounded-lg border border-line/20 text-muted text-xs font-medium hover:bg-panel">Daha sonra</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class CookieBannerComponent {
  readonly visible = signal(this.isBannerNeeded());

  private isBannerNeeded(): boolean {
    try { return localStorage.getItem(STORAGE_KEY) !== 'accepted'; }
    catch { return false; }
  }

  accept(): void {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* noop */ }
    this.visible.set(false);
  }

  dismiss(): void { this.visible.set(false); }
}
