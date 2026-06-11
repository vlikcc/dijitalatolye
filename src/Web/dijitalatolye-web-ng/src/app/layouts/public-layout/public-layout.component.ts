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
      <!-- Ana header -->
      <header class="sticky top-0 z-40 backdrop-blur-xl bg-bg2/80 border-b border-line/10">
        <div class="max-w-7xl mx-auto px-4 lg:px-6 h-[68px] flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-3 shrink-0">
            <img src="assets/brand/logo.png" alt="Dijital Oyun Atölyesi" class="h-11 w-auto" />
            <span class="hidden sm:block font-display font-bold text-ink text-lg lg:text-xl tracking-tight leading-none">
              Dijital&nbsp;Oyun<br class="hidden lg:block" /> <span class="da-rainbow-text">Atölyesi</span>
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-8 text-[15px] font-display font-medium">
            <a routerLink="/games" routerLinkActive="text-accent" class="text-ink/80 hover:text-accent transition-colors">Oyunlar</a>
            <a routerLink="/digital" routerLinkActive="text-accent" class="text-ink/80 hover:text-accent transition-colors">Dijital İçerikler</a>
            <a routerLink="/ebooks" routerLinkActive="text-accent" class="text-ink/80 hover:text-accent transition-colors">E-Kitaplar</a>
            <a routerLink="/about" routerLinkActive="text-accent" class="text-ink/80 hover:text-accent transition-colors">Hakkımızda</a>
          </nav>

          <div class="flex items-center gap-2.5">
            <button type="button" (click)="toggleTheme()"
              class="w-10 h-10 rounded-full border border-line/15 bg-surface/60 hover:border-accent/40 inline-flex items-center justify-center transition"
              [attr.aria-label]="theme() === 'dark' ? 'Gündüz moduna geç' : 'Gece moduna geç'">
              <img [src]="theme() === 'dark' ? 'assets/brand/light-mode.png' : 'assets/brand/dark-mode.png'"
                   [alt]="theme() === 'dark' ? 'Gündüz modu' : 'Gece modu'" class="w-5 h-5" />
            </button>
            <a routerLink="/login"
               class="text-sm font-semibold px-5 py-2 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition">
              Giriş
            </a>
            <a routerLink="/register"
               class="text-sm font-semibold px-5 py-2 rounded-full text-white shadow-lg shadow-accent/25 transition hover:shadow-xl hover:shadow-accent/30"
               style="background:linear-gradient(92deg,#e0457b 0%,#b14fd8 45%,#6f4ee0 100%)">
              KAYIT OL
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
              <img src="assets/brand/logo.png" alt="Dijital Oyun Atölyesi" class="h-11 w-auto" />
              Dijital&nbsp;Oyun <span class="da-rainbow-text">Atölyesi</span>
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
