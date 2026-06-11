import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/api/api.service';

interface GameCard {
  title: string;
  slug: string;
  subject: string;
  gradeLevel?: number;
  icon: string;
  gradient: string;
  views?: number;
  likes?: number;
}
interface Category { name: string; icon: string; subject: string; gradient: string; count: string; }
interface Feature { icon: string; title: string; desc: string; }
interface Step { n: string; title: string; desc: string; icon: string; }
interface Stat { value: string; label: string; }

interface SearchItem {
  id: string; title: string; slug: string; subject?: string; gradeLevel?: number; views?: number; likes?: number;
}
interface SearchResponse { items: SearchItem[]; total: number; }

@Component({
  selector: 'da-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================= HERO ================= -->
    <section class="da-dream-bg relative overflow-hidden">
      <!-- Tam genişlik hero görseli — kenarlardan küçük marjla tek panel (hedef tasarımdaki gibi) -->
      <div class="relative w-full px-2 pt-2 sm:px-4 sm:pt-4">
        <img src="assets/brand/hero-bg.png" alt="Dijital Oyun Atölyesi oyun ekranları"
             class="block w-full h-auto select-none pointer-events-none rounded-lg" />

        <!-- lg+ : metin görselin sağındaki boş alana overlay -->
        <div class="hidden lg:flex absolute inset-y-0 right-0 w-[40%] pr-[3.2vw] pl-[1vw] pt-[2.6vw] flex-col justify-start items-end text-right animate-fade-up">
          <img src="assets/brand/logo.png" alt="" aria-hidden="true"
               class="w-[7.5vw] max-w-[155px] h-auto mb-[0.5vw]" />
          <h1 class="da-display font-bold text-ink leading-[1.03]">
            <span class="block" style="font-size:3vw">Öğrenmenin</span>
            <span class="block da-script da-rainbow-text" style="font-size:3.5vw">En Eğlenceli</span>
            <span class="block" style="font-size:3vw">Hâli</span>
          </h1>
          <p class="text-muted leading-relaxed mt-[0.8vw] max-w-[30vw]" style="font-size:0.94vw">
            Dijital Oyun Atölyesi; öğretmenlerin ürettiği interaktif eğitsel
            oyunları ve dijital içerikleri, sınıf-ders-öğrenme çıktısı bazlı,
            güvenli sandbox ortamında öğrencilerle buluşturur.
          </p>
          <p class="da-script da-rainbow-text mt-[0.6vw]" style="font-size:1.6vw">
            Hesap aç, tıkla, oyna ve öğren!
          </p>
          <div class="mt-[0.9vw] w-full flex flex-col items-end">
            <div class="da-eyebrow text-accent2" style="font-size:0.76vw">
              MEB Müfredatı - AI Ön İnceleme - Editör Onaylı
            </div>
            <div class="mt-[0.4vw] h-px w-[22vw] max-w-full bg-gradient-to-l from-cyan2/70 via-accent2/40 to-transparent"></div>
          </div>
        </div>

        <!-- lg+ : istatistikler görselin alt bandının üzerine overlay (hedef tasarımdaki gibi) -->
        <div class="hidden lg:flex absolute inset-x-0 bottom-0 h-[7.2vw] items-center px-[4.5vw] gap-[2vw] animate-fade-up">
          <div class="flex items-start gap-[3.2vw]">
            @for (s of stats; track s.label) {
              <div>
                <div class="da-display font-bold text-accent2 leading-none" style="font-size:1.9vw">{{ s.value }}</div>
                <div class="mt-[0.45vw] font-mono tracking-widest uppercase text-muted leading-snug" style="font-size:0.62vw">{{ s.label }}</div>
              </div>
            }
          </div>
          <div class="flex-1 h-px bg-ink/25 mx-[1vw]"></div>
          <a routerLink="/discover"
             class="shrink-0 inline-flex items-center justify-center gap-2 rounded-full da-grad font-display font-semibold tracking-wide shadow-lg shadow-accent2/25 transition px-[1.8vw] py-[0.75vw]" style="font-size:0.92vw">
            <mat-icon style="font-size:1.1vw;width:1.1vw;height:1.1vw">sports_esports</mat-icon>
            OYUNLARI KEŞFET
          </a>
        </div>
      </div>

      <!-- lg altı: metin görselin altında normal akışta -->
      <div class="lg:hidden px-4 pt-5 pb-2 animate-fade-up">
        <div class="flex justify-center mb-3">
          <img src="assets/brand/logo.png" alt="" aria-hidden="true" class="h-16 w-auto" />
        </div>
        <h1 class="da-display font-bold text-ink text-4xl sm:text-5xl leading-[1.06] text-center">
          Öğrenmenin
          <span class="block da-script da-rainbow-text text-6xl sm:text-7xl my-1">En Eğlenceli</span>
          Hâli
        </h1>
        <p class="mt-5 text-base text-muted leading-relaxed text-center max-w-xl mx-auto">
          Dijital Oyun Atölyesi; öğretmenlerin ürettiği interaktif eğitsel oyunları ve dijital içerikleri,
          sınıf-ders-öğrenme çıktısı bazlı, güvenli sandbox ortamında öğrencilerle buluşturur.
        </p>
        <p class="mt-4 da-script da-rainbow-text text-3xl text-center">Hesap aç, tıkla, oyna ve öğren!</p>
        <div class="mt-4 da-eyebrow text-accent2 text-center">MEB Müfredatı - AI Ön İnceleme - Editör Onaylı</div>
      </div>

      <!-- İstatistik şeridi — yalnız mobil/tablet (lg+'da görselin alt bandına overlay) -->
      <div class="lg:hidden relative">
        <div class="max-w-7xl mx-auto px-4 pb-8 pt-4 flex flex-col gap-8">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
            @for (s of stats; track s.label) {
              <div>
                <div class="da-display text-3xl lg:text-4xl font-bold text-accent2 leading-none">{{ s.value }}</div>
                <div class="mt-2 font-mono text-[11px] tracking-widest uppercase text-dim leading-snug">{{ s.label }}</div>
              </div>
            }
          </div>
          <a routerLink="/discover"
             class="shrink-0 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full da-grad font-display font-semibold tracking-wide shadow-lg shadow-accent2/25 transition">
            <mat-icon style="font-size:18px;width:18px;height:18px">sports_esports</mat-icon>
            OYUNLARI KEŞFET
          </a>
        </div>
      </div>
    </section>

    <!-- ================= ÖNE ÇIKAN OYUNLAR ================= -->
    <section class="relative py-20 bg-bg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div class="da-eyebrow mb-3">[ 02 ] Öne Çıkan Oyunlar</div>
            <h2 class="da-display text-3xl md:text-4xl font-bold text-ink">
              Hemen <span class="da-script da-rainbow-text">oynamaya</span> başla
            </h2>
            <p class="mt-2 text-muted max-w-xl">Editör onayından geçmiş, en çok oynanan interaktif içerikler.</p>
          </div>
          <a routerLink="/discover" class="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-brand-700 group">
            Tümünü gör
            <mat-icon class="transition group-hover:translate-x-0.5" style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
          </a>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          @for (g of displayGames(); track g.slug) {
            <a [routerLink]="['/play', g.slug]" class="group rounded-2xl overflow-hidden border border-line/10 bg-surface hover:-translate-y-1 hover:shadow-glow transition-all duration-300">
              <div class="relative h-40 overflow-hidden" [style.background]="g.gradient">
                <div class="absolute inset-0 bg-grid-line opacity-30" style="background-size:22px 22px"></div>
                <mat-icon class="!text-white/90 absolute top-4 left-4" style="font-size:30px;width:30px;height:30px">{{ g.icon }}</mat-icon>
                <span class="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-black/25 backdrop-blur text-white text-[10px] font-mono tracking-wider uppercase">{{ g.subject }}</span>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span class="w-14 h-14 rounded-full bg-white/95 text-accent inline-flex items-center justify-center shadow-xl">
                    <mat-icon style="font-size:30px;width:30px;height:30px">play_arrow</mat-icon>
                  </span>
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-display font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent transition">{{ g.title }}</h3>
                <div class="mt-3 flex items-center justify-between font-mono text-[11px] tracking-wider uppercase text-dim">
                  <span>{{ g.gradeLevel ? g.gradeLevel + '. Sınıf' : 'Tüm Seviyeler' }}</span>
                  <span class="inline-flex items-center gap-2">
                    <span class="inline-flex items-center gap-1"><mat-icon style="font-size:13px;width:13px;height:13px">visibility</mat-icon>{{ g.views ?? 0 }}</span>
                    <span class="inline-flex items-center gap-1 text-accent2"><mat-icon style="font-size:13px;width:13px;height:13px">favorite</mat-icon>{{ g.likes ?? 0 }}</span>
                  </span>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ================= KATEGORİLER ================= -->
    <section class="relative py-20 da-dream-bg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="da-eyebrow mb-3">[ 03 ] Kategoriler</div>
        <h2 class="da-display text-3xl md:text-4xl font-bold text-ink max-w-2xl">
          İlgini çeken alanı seç, <span class="da-script da-rainbow-text">keşfe</span> çık.
        </h2>
        <p class="mt-2 text-muted max-w-xl">Her ders için özenle hazırlanmış, kazanım odaklı oyun ve etkinlikler.</p>

        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (c of categories; track c.subject; let i = $index) {
            <a [routerLink]="['/discover']" [queryParams]="{ subject: c.subject }"
               class="group relative rounded-2xl border border-line/10 bg-surface p-6 overflow-hidden hover:border-accent/40 hover:shadow-card transition">
              <div class="da-blob -top-10 -right-8 w-32 h-32 opacity-40 transition group-hover:opacity-70" [style.background]="c.gradient"></div>
              <div class="relative flex items-start justify-between">
                <span class="w-12 h-12 rounded-xl inline-flex items-center justify-center text-white shadow-lg" [style.background]="c.gradient">
                  <mat-icon style="font-size:24px;width:24px;height:24px">{{ c.icon }}</mat-icon>
                </span>
                <span class="font-mono text-xs tracking-widest text-dim">0{{ i + 1 }}</span>
              </div>
              <h3 class="relative mt-5 font-display text-xl font-semibold text-ink">{{ c.name }}</h3>
              <p class="relative mt-1 font-mono text-[11px] tracking-widest uppercase text-dim">{{ c.count }}</p>
              <span class="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all">
                Oyunlara git <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
              </span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ================= NASIL ÇALIŞIR / NEDEN ================= -->
    <section id="nasil" class="relative py-20 bg-bg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="da-eyebrow mb-3">[ 04 ] Nasıl Çalışır</div>
        <h2 class="da-display text-3xl md:text-4xl font-bold text-ink max-w-2xl">
          Üç adımda <span class="da-script da-rainbow-text">güvenli</span> öğrenme.
        </h2>

        <div class="mt-12 grid md:grid-cols-3 gap-6">
          @for (s of steps; track s.n) {
            <div class="relative rounded-2xl border border-line/10 bg-surface p-7">
              <div class="absolute -top-4 left-7 w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 text-white inline-flex items-center justify-center font-display font-bold text-sm shadow-lg shadow-accent/30">{{ s.n }}</div>
              <mat-icon class="!text-accent mt-3" style="font-size:26px;width:26px;height:26px">{{ s.icon }}</mat-icon>
              <h3 class="mt-3 font-display text-lg font-semibold text-ink">{{ s.title }}</h3>
              <p class="mt-2 text-sm text-muted leading-relaxed">{{ s.desc }}</p>
            </div>
          }
        </div>

        <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          @for (f of features; track f.title) {
            <div class="rounded-2xl border border-line/10 bg-panel p-6 hover:border-accent/30 transition">
              <div class="w-10 h-10 rounded-lg bg-accent/10 text-accent inline-flex items-center justify-center mb-4">
                <mat-icon style="font-size:20px;width:20px;height:20px">{{ f.icon }}</mat-icon>
              </div>
              <h3 class="font-display font-semibold text-ink">{{ f.title }}</h3>
              <p class="mt-2 text-sm text-muted leading-relaxed">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ================= CTA ================= -->
    <section class="relative py-20 bg-bg">
      <div class="max-w-6xl mx-auto px-4">
        <div class="relative overflow-hidden rounded-3xl px-8 py-14 md:px-14 md:py-20 text-center"
             style="background:linear-gradient(135deg,#0b5f8c 0%,#5a3fcb 100%)">
          <div class="absolute inset-0 bg-grid-line opacity-20" style="background-size:26px 26px"></div>
          <div class="da-blob -right-16 -bottom-16 w-72 h-72 bg-white/15"></div>
          <div class="relative">
            <div class="font-mono text-[11px] tracking-[0.25em] uppercase text-white/80">Ücretsiz · Kart Bilgisi Yok</div>
            <h2 class="mt-4 da-display text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
              Hazırsan, ilk oyunun <span class="da-script">bir tık</span> uzakta.
            </h2>
            <p class="mt-4 text-white/85 max-w-xl mx-auto">Öğrenci, öğretmen ya da meraklı; hemen başla. Yüzlerce eğitsel oyun ve dijital içerik seni bekliyor.</p>
            <div class="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <a routerLink="/register" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface text-accent font-semibold hover:bg-white/90 shadow-lg transition">
                Ücretsiz başla <mat-icon style="font-size:18px;width:18px;height:18px">arrow_forward</mat-icon>
              </a>
              <a routerLink="/discover" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition">Önce göz at</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly liveGames = signal<GameCard[] | null>(null);
  readonly displayGames = computed(() => this.liveGames() ?? this.fallbackGames);

  readonly stats: Stat[] = [
    { value: 'K-12', label: 'Tüm Sınıflar İçin' },
    { value: 'MEB', label: 'Öğrenme Çıktısı Eşlemeli' },
    { value: '%100', label: 'AI Ön İnceleme' },
    { value: 'Ø', label: 'Ücretsiz Erişim' },
  ];

  readonly categories: Category[] = [
    { name: 'Matematik', subject: 'Matematik', icon: 'calculate', count: 'Sayılar · Geometri · Mantık', gradient: 'linear-gradient(135deg,#0b5f8c,#1a72a3)' },
    { name: 'Fen Bilimleri', subject: 'Fen Bilimleri', icon: 'science', count: 'Deney · Doğa · Madde', gradient: 'linear-gradient(135deg,#5a3fcb,#8b6bf0)' },
    { name: 'Bilişim', subject: 'Bilişim', icon: 'memory', count: 'Kodlama · Algoritma', gradient: 'linear-gradient(135deg,#0cb5db,#0b5f8c)' },
    { name: 'Türkçe', subject: 'Türkçe', icon: 'menu_book', count: 'Okuma · Dil · Anlatım', gradient: 'linear-gradient(135deg,#b57f1f,#d6a52f)' },
    { name: 'Sosyal Bilgiler', subject: 'Sosyal Bilgiler', icon: 'public', count: 'Tarih · Coğrafya', gradient: 'linear-gradient(135deg,#4a32a8,#5a3fcb)' },
    { name: 'İngilizce', subject: 'İngilizce', icon: 'translate', count: 'Kelime · Dinleme', gradient: 'linear-gradient(135deg,#1a72a3,#0cb5db)' },
  ];

  readonly steps: Step[] = [
    { n: '01', title: 'Keşfet', desc: 'Sınıfına, dersine veya kazanıma göre filtrele; ilgini çeken oyunu seç.', icon: 'search' },
    { n: '02', title: 'Güvenle Oyna', desc: 'Tüm içerikler izole sandbox iframe içinde çalışır. Cihazın ve verin daima korunur.', icon: 'shield' },
    { n: '03', title: 'Öğren & İlerle', desc: 'Eğlenirken kazanımları pekiştir; ilerlemeni takip et, yeni içeriklerle devam et.', icon: 'trending_up' },
  ];

  readonly features: Feature[] = [
    { icon: 'verified_user', title: 'Editör onaylı', desc: 'Her içerik AI ön incelemesi ve insan editör onayından geçer; sadece güvenli ve müfredata uygun olanlar yayınlanır.' },
    { icon: 'lock', title: 'Sandbox güvenliği', desc: 'İnteraktif HTML/JS içerikler izole iframe içinde oynar; reklam, izleme veya zararlı kod barınmaz.' },
    { icon: 'school', title: 'MEB kazanımları', desc: 'Her oyun sınıf, ders, ünite ve kazanım koduna bağlıdır. Öğretmenler ders planına tek tıkla ekler.' },
    { icon: 'bolt', title: 'Hızlı keşif', desc: 'Güçlü arama ve filtrelerle aradığın içeriği saniyeler içinde bul, anında oynamaya başla.' },
  ];

  private readonly gradients = [
    'linear-gradient(135deg,#0b5f8c,#5a3fcb)',
    'linear-gradient(135deg,#5a3fcb,#8b6bf0)',
    'linear-gradient(135deg,#0cb5db,#0b5f8c)',
    'linear-gradient(135deg,#1a72a3,#0cb5db)',
    'linear-gradient(135deg,#b57f1f,#d6a52f)',
    'linear-gradient(135deg,#4a32a8,#5a3fcb)',
  ];
  private readonly icons = ['extension', 'casino', 'rocket_launch', 'psychology', 'lightbulb', 'emoji_objects', 'auto_awesome', 'science'];

  readonly fallbackGames: GameCard[] = [
    { title: 'Kesirlerle Pizza Macerası', slug: 'kesirler-pizza', subject: 'Matematik', gradeLevel: 4, icon: 'extension', gradient: this.gradients[0], views: 1240, likes: 318 },
    { title: 'Gezegenler Arası Yolculuk', slug: 'gezegenler-yolculuk', subject: 'Fen', gradeLevel: 5, icon: 'rocket_launch', gradient: this.gradients[1], views: 980, likes: 256 },
    { title: 'Algoritma Labirenti', slug: 'algoritma-labirenti', subject: 'Bilişim', gradeLevel: 6, icon: 'memory', gradient: this.gradients[2], views: 1530, likes: 402 },
    { title: 'Kelime Avı: Eş Anlamlılar', slug: 'kelime-avi', subject: 'Türkçe', gradeLevel: 3, icon: 'menu_book', gradient: this.gradients[4], views: 760, likes: 190 },
  ];

  ngOnInit(): void {
    this.api.get<SearchResponse>('/search/contents', { page: 1, pageSize: 8 }).subscribe({
      next: (data) => {
        const items = data?.items ?? [];
        if (!items.length) return; // fallback kalsın
        this.liveGames.set(items.slice(0, 8).map((it, i) => ({
          title: it.title,
          slug: it.slug,
          subject: it.subject ?? 'Genel',
          gradeLevel: it.gradeLevel,
          icon: this.icons[i % this.icons.length],
          gradient: this.gradients[i % this.gradients.length],
          views: it.views,
          likes: it.likes,
        })));
      },
      error: () => { /* fallback oyunlar gösterilir */ },
    });
  }
}
