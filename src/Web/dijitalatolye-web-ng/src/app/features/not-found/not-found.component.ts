import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'da-not-found',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      <div class="absolute inset-0 da-dream-bg" aria-hidden="true"></div>
      <div class="absolute -top-32 right-0 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden="true"></div>
      <div class="relative text-center max-w-lg">
        <span class="inline-flex w-14 h-14 rounded-2xl da-grad text-white items-center justify-center shadow-lg shadow-brand-700/20">
          <mat-icon class="!text-white" style="font-size:28px;width:28px;height:28px">explore</mat-icon>
        </span>
        <h1 class="mt-6 text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-accent-500">404</h1>
        <h2 class="mt-2 text-2xl font-bold text-ink">Sayfa bulunamadı</h2>
        <p class="mt-3 text-muted">Aradığınız sayfa kaldırılmış, taşınmış ya da hiç var olmamış olabilir. Ana sayfaya dönüp keşfe devam edin.</p>
        <div class="mt-6 flex justify-center gap-3">
          <a routerLink="/" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20">
            <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon> Ana sayfa
          </a>
          <a routerLink="/discover" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line/15 text-muted hover:border-brand-300 hover:text-brand-700 bg-surface">İçerikleri keşfet</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
