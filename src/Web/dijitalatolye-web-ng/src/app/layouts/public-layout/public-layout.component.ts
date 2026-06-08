import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CookieBannerComponent } from '@shared/cookie-banner/cookie-banner.component';

type Theme = 'light' | 'dark';

@Component({
  selector: 'da-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CookieBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; min-height: 100%; }`],
  template: `
    <div class="min-h-full flex flex-col bg-bg text-ink">
      <!-- Üst eyebrow şeridi -->
      <div class="hidden md:block border-b border-line/10 bg-bg2/60">
        <div class="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between font-mono text-[11px] tracking-widest uppercase text-dim">
          <span class="inline-flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot"></span>
            Dijital Atölye · Oyunla Öğrenme Platformu
          </span>
          <span class="inline-flex items-center gap-5">
            <a routerLink="/games" class="hover:text-accent transition-colors">Oyunlar</a>
            <a routerLink="/digital" class="hover:text-accent transition-colors">Dijital İçerikler</a>
            <a routerLink="/ebooks" class="hover:text-accent transition-colors">e-Kitaplar</a>
            <span class="text-accent">v1 · Türkiye</span>
          </span>
        </div>
      </div>

      <!-- Ana header -->
      <header class="sticky top-0 z-40 backdrop-blur-xl bg-bg/80 border-b border-line/10">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-2.5 font-display font-bold text-ink">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 text-white shadow-lg shadow-accent/25">
              <mat-icon class="!text-white" style="font-size:18px;width:18px;height:18px">sports_esports</mat-icon>
            </span>
            <span class="text-lg tracking-tight">Dijital<span class="text-accent">Atölye</span></span>
          </a>

          <nav class="hidden md:flex items-center gap-7 text-sm">
            <a routerLink="/games" routerLinkActive="text-accent" class="text-muted hover:text-accent transition-colors font-medium">Oyunlar</a>
            <a routerLink="/digital" routerLinkActive="text-accent" class="text-muted hover:text-accent transition-colors font-medium">Dijital İçerikler</a>
            <a routerLink="/ebooks" routerLinkActive="text-accent" class="text-muted hover:text-accent transition-colors font-medium">e-Kitaplar</a>
            <a routerLink="/about" routerLinkActive="text-accent" class="text-muted hover:text-accent transition-colors font-medium">Hakkımızda</a>
          </nav>

          <div class="flex items-center gap-2">
            <button type="button" (click)="toggleTheme()"
              class="w-9 h-9 rounded-lg border border-line/15 text-muted hover:text-accent hover:border-accent/40 inline-flex items-center justify-center transition"
              [attr.aria-label]="theme() === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'">
              <mat-icon style="font-size:18px;width:18px;height:18px">{{ theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            <a routerLink="/login" class="hidden sm:inline-flex text-sm font-medium text-muted hover:text-accent px-3 py-2 rounded-lg transition">Giriş</a>
            <a routerLink="/register"
               class="text-sm font-semibold px-4 py-2 rounded-xl bg-accent text-white hover:bg-brand-700 shadow-lg shadow-accent/25 transition inline-flex items-center gap-1.5">
              Hemen Oyna
              <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
            </a>
          </div>
        </div>
      </header>

      <main class="flex-1"><router-outlet /></main>
      <da-cookie-banner />

      <!-- Footer -->
      <footer class="relative mt-auto bg-bg2 border-t border-line/10 text-muted overflow-hidden">
        <div class="da-blob -top-20 -left-10 w-72 h-72 bg-accent/10"></div>
        <div class="da-blob -bottom-24 right-0 w-80 h-80 bg-accent2/10"></div>
        <div class="relative max-w-7xl mx-auto px-4 py-14 grid gap-10 md:grid-cols-4 text-sm">
          <div class="md:col-span-2">
            <a routerLink="/" class="flex items-center gap-2.5 font-display font-bold text-ink text-lg">
              <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 text-white">
                <mat-icon style="font-size:18px;width:18px;height:18px">sports_esports</mat-icon>
              </span>
              Dijital<span class="text-accent">Atölye</span>
            </a>
            <p class="mt-4 max-w-md leading-relaxed text-muted">
              Eğlenerek öğrenmenin dijital adresi. MEB müfredatına uygun, AI ön incelemesinden geçmiş,
              editör onaylı interaktif <span class="text-ink font-medium">eğitsel oyunlar</span> ve dijital içerikler tek platformda.
            </p>
            <div class="mt-5 flex items-center gap-3 font-mono text-[11px] tracking-widest uppercase text-dim">
              <span class="w-1.5 h-1.5 rounded-full bg-accent"></span> Bilim · Eğitim · Oyun
            </div>
          </div>
          <div>
            <h4 class="font-display font-semibold text-ink mb-4">Keşfet</h4>
            <ul class="space-y-2.5">
              <li><a routerLink="/games" class="hover:text-accent transition-colors">Oyunlar</a></li>
              <li><a routerLink="/digital" class="hover:text-accent transition-colors">Dijital İçerikler</a></li>
              <li><a routerLink="/ebooks" class="hover:text-accent transition-colors">e-Kitaplar</a></li>
              <li><a routerLink="/teacher/contents/new" class="hover:text-accent transition-colors">İçerik Yükle</a></li>
              <li><a routerLink="/register" class="hover:text-accent transition-colors">Ücretsiz Hesap</a></li>
              <li><a routerLink="/about" class="hover:text-accent transition-colors">Hakkımızda</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-display font-semibold text-ink mb-4">Yasal</h4>
            <ul class="space-y-2.5">
              <li><a routerLink="/kvkk" class="hover:text-accent transition-colors">KVKK ve Verileriniz</a></li>
              <li><a routerLink="/login" class="hover:text-accent transition-colors">Giriş Yap</a></li>
            </ul>
          </div>
        </div>
        <div class="relative border-t border-line/10">
          <div class="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-[11px] tracking-wider uppercase text-dim">
            <span>© {{ year }} DijitalAtölye · Tüm hakları saklıdır</span>
            <span>Türkiye · MEB Müfredatı Uyumlu</span>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {
  readonly year = new Date().getFullYear();
  readonly theme = signal<Theme>(this.readTheme());

  private readTheme(): Theme {
    if (typeof document === 'undefined') return 'light';
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('da-theme', next); } catch { /* yoksay */ }
  }
}
