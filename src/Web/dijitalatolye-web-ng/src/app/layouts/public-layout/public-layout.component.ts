import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CookieBannerComponent } from '@shared/cookie-banner/cookie-banner.component';

@Component({
  selector: 'da-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CookieBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; min-height: 100%; }`],
  template: `
    <div class="min-h-full flex flex-col">
      <header class="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-brand-100/70">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2 font-bold text-brand-700">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-700/20">
              <mat-icon class="!text-white" style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon>
            </span>
            <span class="text-base tracking-tight">DijitalAtölye</span>
          </a>
          <nav class="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a routerLink="/discover" routerLinkActive="text-brand-700" class="hover:text-brand-700 transition-colors font-medium">Keşfet</a>
            <a routerLink="/about" routerLinkActive="text-brand-700" class="hover:text-brand-700 transition-colors font-medium">Hakkımızda</a>
          </nav>
          <div class="flex items-center gap-2">
            <a routerLink="/login" class="text-sm font-medium text-slate-700 hover:text-brand-700 px-3 py-2 rounded-lg">Giriş</a>
            <a routerLink="/register"
               class="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800 shadow-md shadow-brand-700/20">
              Ücretsiz Kayıt
            </a>
          </div>
        </div>
      </header>

      <main class="flex-1"><router-outlet /></main>
      <da-cookie-banner />


      <footer class="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-brand-100">
        <div class="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4 text-sm">
          <div class="md:col-span-2">
            <a routerLink="/" class="flex items-center gap-2 font-bold text-white">
              <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white">
                <mat-icon style="font-size:18px;width:18px;height:18px">auto_awesome</mat-icon>
              </span>
              DijitalAtölye
            </a>
            <p class="mt-3 text-brand-200 max-w-md leading-relaxed">
              MEB müfredatına uygun, AI destekli ön incelemeden geçmiş, editör onaylı dijital eğitim
              içeriklerinin K-12 öğretmen ve öğrencileriyle buluştuğu açık platform.
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-3">Ürün</h4>
            <ul class="space-y-2">
              <li><a routerLink="/discover" class="hover:text-white">İçerik Keşfet</a></li>
              <li><a routerLink="/teacher/contents/new" class="hover:text-white">İçerik Yükle</a></li>
              <li><a routerLink="/register" class="hover:text-white">Hesap Aç</a></li>
              <li><a routerLink="/about" class="hover:text-white">Hakkımızda</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-3">Yasal</h4>
            <ul class="space-y-2">
              <li><a routerLink="/kvkk" class="hover:text-white">KVKK ve Verileriniz</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-brand-700/50">
          <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-brand-300">
            <span>© {{ year }} DijitalAtölye. Tüm hakları saklıdır.</span>
            <span>v1 • Türkiye</span>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {
  readonly year = new Date().getFullYear();
}
