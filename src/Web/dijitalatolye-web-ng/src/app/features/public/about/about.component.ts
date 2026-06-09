import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'da-about',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface">
      <section class="relative overflow-hidden">
        <div class="absolute inset-0 da-dream-bg" aria-hidden="true"></div>
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" aria-hidden="true"></div>
        <div class="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">Hakkımızda</span>
          <h1 class="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-ink">
            Türkiye'nin <span class="bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-accent-500">öğretmen üretici</span> dijital içerik platformu
          </h1>
          <p class="mt-5 text-lg text-muted max-w-3xl mx-auto leading-relaxed">
            DijitalAtölye, K-12 öğretmenlerinin ürettiği interaktif HTML/JS içerikleri AI ön incelemesinden geçirip
            editör onayıyla yayınlayan, MEB müfredatına bağlı, sandbox güvenli bir açık eğitim platformudur.
          </p>
        </div>
      </section>

      <section class="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div class="inline-flex w-12 h-12 rounded-xl bg-brand-100 text-brand-700 items-center justify-center mb-4">
            <mat-icon style="font-size:24px;width:24px;height:24px">flag</mat-icon>
          </div>
          <h2 class="text-3xl font-extrabold text-ink">Misyonumuz</h2>
          <p class="mt-3 text-muted leading-relaxed">
            Türkiye'deki her sınıfa, müfredata uygun ve güvenli interaktif içerikleri saniyeler içinde ulaştırmak.
            Öğretmenlerin yaratıcılığını çoğaltmak, öğrencilere zengin dijital deneyimler sunmak.
          </p>
        </div>
        <div>
          <div class="inline-flex w-12 h-12 rounded-xl bg-accent-100 text-accent-600 items-center justify-center mb-4">
            <mat-icon style="font-size:24px;width:24px;height:24px">favorite</mat-icon>
          </div>
          <h2 class="text-3xl font-extrabold text-ink">Vizyonumuz</h2>
          <p class="mt-3 text-muted leading-relaxed">
            Türkiye'nin en geniş açık dijital eğitim içerik kütüphanesi olmak. Her öğretmenin üretici, her öğrencinin
            keşfeden, her ailenin güvenen olduğu bir ekosistem inşa etmek.
          </p>
        </div>
      </section>

      <section class="bg-panel py-16">
        <div class="max-w-5xl mx-auto px-4">
          <h2 class="text-3xl font-extrabold text-ink text-center">Değerlerimiz</h2>
          <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            @for (v of values; track v.title) {
              <div class="rounded-2xl bg-surface border border-line/15 p-6 hover:border-brand-300 hover:shadow-md transition">
                <div class="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-3">
                  <mat-icon style="font-size:20px;width:20px;height:20px">{{ v.icon }}</mat-icon>
                </div>
                <h3 class="font-semibold text-ink">{{ v.title }}</h3>
                <p class="mt-1.5 text-sm text-muted leading-relaxed">{{ v.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="py-20">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h2 class="text-3xl font-extrabold text-ink">Yolculuğumuza katılın</h2>
          <p class="mt-3 text-muted">İçerik üretmek, denetlemek veya keşfetmek — yeriniz hazır.</p>
          <div class="mt-6 flex justify-center gap-3">
            <a routerLink="/register" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl da-grad text-white font-semibold shadow-md shadow-brand-600/20">
              Hesap aç
              <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
            </a>
            <a routerLink="/discover" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-line/15 text-muted hover:border-brand-300 hover:text-brand-700">İçerikleri keşfet</a>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class AboutComponent {
  readonly values = [
    { icon: 'verified_user', title: 'Güvenlik önce', desc: 'Her içerik AI + statik analiz + sandbox iframe ile çocuklarınız için izole çalışır.' },
    { icon: 'memory', title: 'Akıllı moderasyon', desc: 'AI ön inceleme; pedagojik kalite, müfredat uyumu ve risk değerlendirmesi otomatik raporlanır.' },
    { icon: 'menu_book', title: 'Müfredata bağlı', desc: 'Her içerik MEB kazanım koduna eşlenir; öğretmen kazanıma göre filtreler.' },
    { icon: 'group', title: 'Şeffaf süreç', desc: 'AI raporu, editör kararı, audit log — her adım izlenebilir ve denetlenebilir.' },
  ];
}
