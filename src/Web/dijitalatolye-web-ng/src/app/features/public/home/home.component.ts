import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Feature { icon: string; title: string; desc: string; }
interface Step { n: string; title: string; desc: string; icon: string; }
interface Audience { icon: string; title: string; bullets: string[]; ctaLabel: string; ctaTo: string; }
interface Stat { value: string; label: string; }
interface Score { label: string; value: number; tone: 'brand' | 'emerald' | 'amber'; }

@Component({
  selector: 'da-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white">
      <!-- HERO -->
      <section class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white" aria-hidden="true"></div>
        <div class="absolute inset-0 bg-grid-slate opacity-40" style="background-size:32px 32px" aria-hidden="true"></div>
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden="true"></div>
        <div class="absolute top-32 -right-32 w-[28rem] h-[28rem] bg-accent-500/10 rounded-full blur-3xl" aria-hidden="true"></div>

        <div class="relative max-w-6xl mx-auto px-4 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-7 animate-fade-up">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-100 text-brand-700 text-xs font-medium shadow-sm">
              <mat-icon style="font-size:14px;width:14px;height:14px">auto_awesome</mat-icon>
              AI destekli, editör onaylı, sandbox güvenli
            </span>
            <h1 class="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              MEB müfredatına uygun,
              <span class="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-accent-500">güvenli dijital içerikler</span>
              bir tık uzakta
            </h1>
            <p class="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
              DijitalAtölye, K-12 öğretmenlerinin ürettiği interaktif HTML içerikleri AI ön incelemesinden geçirir,
              editör onayıyla yayınlar ve öğrencilere sınıf-ders-kazanım bazlı sunar. Tek platform, tüm süreç şeffaf.
            </p>
            <div class="mt-8 flex flex-col sm:flex-row gap-3">
              <a routerLink="/register"
                 class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition">
                Ücretsiz hesap aç
                <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
              </a>
              <a routerLink="/discover"
                 class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:border-brand-300 hover:text-brand-700 transition">
                <mat-icon style="font-size:16px;width:16px;height:16px">play_circle</mat-icon>
                İçerikleri keşfet
              </a>
            </div>
            <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              @for (t of bullets; track t) {
                <li class="inline-flex items-center gap-2">
                  <mat-icon class="!text-brand-600" style="font-size:16px;width:16px;height:16px">check_circle</mat-icon>
                  {{ t }}
                </li>
              }
            </ul>
          </div>

          <!-- AI rapor kart mockup -->
          <div class="lg:col-span-5 animate-fade-up" style="animation-delay:120ms">
            <div class="relative">
              <div class="absolute -inset-6 bg-gradient-to-tr from-brand-200/60 via-white to-accent-500/20 rounded-3xl blur-2xl" aria-hidden="true"></div>
              <div class="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-brand-900/5 overflow-hidden">
                <div class="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <div class="flex gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-300"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-300"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-300"></span>
                  </div>
                  <span class="ml-2 text-xs text-slate-500 font-medium">moderation-report.json</span>
                </div>
                <div class="p-5 space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-wide text-slate-500">İçerik</p>
                      <p class="font-semibold text-slate-900">5. Sınıf • Doğal Sayılar</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">AI: Onay önerisi</span>
                  </div>
                  @for (s of scores; track s.label) {
                    <div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-slate-600">{{ s.label }}</span>
                        <span class="font-semibold text-slate-900">{{ s.value }}</span>
                      </div>
                      <div class="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full rounded-full"
                          [class.bg-gradient-to-r]="true"
                          [class.from-brand-500]="s.tone==='brand'" [class.to-brand-700]="s.tone==='brand'"
                          [class.from-emerald-400]="s.tone==='emerald'" [class.to-emerald-600]="s.tone==='emerald'"
                          [class.from-amber-400]="s.tone==='amber'" [class.to-amber-600]="s.tone==='amber'"
                          [style.width.%]="s.value"></div>
                      </div>
                    </div>
                  }
                  <div class="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                    <div><div class="text-sm font-bold text-slate-900">0</div><div class="text-[11px] text-slate-500">Kritik risk</div></div>
                    <div><div class="text-sm font-bold text-slate-900">2</div><div class="text-[11px] text-slate-500">Uyarı</div></div>
                    <div><div class="text-sm font-bold text-slate-900">M.5.1.1.1</div><div class="text-[11px] text-slate-500">Kazanım</div></div>
                  </div>
                </div>
              </div>
              <div class="absolute -bottom-6 -left-6 hidden md:block animate-float-slow">
                <div class="rounded-xl bg-white border border-slate-200 shadow-lg p-3 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 inline-flex items-center justify-center">
                    <mat-icon style="font-size:20px;width:20px;height:20px">verified</mat-icon>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Editör kararı</p>
                    <p class="text-sm font-semibold text-slate-900">Onaylandı, yayında</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="relative max-w-6xl mx-auto px-4 pb-12">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (s of stats; track s.label) {
              <div class="rounded-xl bg-white/70 backdrop-blur border border-slate-200 px-4 py-3 text-center">
                <div class="text-2xl font-extrabold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">{{ s.value }}</div>
                <div class="text-xs text-slate-600 mt-0.5">{{ s.label }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="py-20 bg-white">
        <div class="max-w-6xl mx-auto px-4">
          <div class="max-w-2xl text-center mx-auto">
            <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">Platform</span>
            <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Üreten öğretmene, koruyan platforma ihtiyaç var.</h2>
            <p class="mt-3 text-slate-600 leading-relaxed">DijitalAtölye, içerik üretimi ile öğrenci güvenliği arasındaki dengeyi mühendislikle kurar. AI hız verir, editör güvence verir, sandbox koruma verir.</p>
          </div>
          <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (f of features; track f.title) {
              <article class="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/5 transition">
                <div class="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition">
                  <mat-icon style="font-size:20px;width:20px;height:20px">{{ f.icon }}</mat-icon>
                </div>
                <h3 class="font-semibold text-slate-900">{{ f.title }}</h3>
                <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ f.desc }}</p>
              </article>
            }
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section id="nasil-calisir" class="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div class="max-w-6xl mx-auto px-4">
          <div class="max-w-2xl text-center mx-auto">
            <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">Nasıl çalışır</span>
            <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Yükleme'den yayına 3 adım.</h2>
            <p class="mt-3 text-slate-600 leading-relaxed">Üretmek isteyene maksimum hız, koruma altında olan öğrenciye maksimum güvenlik.</p>
          </div>
          <div class="mt-14 relative">
            <div class="hidden md:block absolute top-12 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" aria-hidden="true"></div>
            <div class="grid md:grid-cols-3 gap-6">
              @for (s of steps; track s.n) {
                <div class="relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                  <div class="absolute -top-5 left-6 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white inline-flex items-center justify-center font-bold shadow-lg shadow-brand-600/30">{{ s.n }}</div>
                  <div class="pt-4">
                    <mat-icon class="!text-brand-600" style="font-size:24px;width:24px;height:24px">{{ s.icon }}</mat-icon>
                    <h3 class="mt-3 text-lg font-semibold text-slate-900">{{ s.title }}</h3>
                    <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ s.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- AUDIENCES -->
      <section id="kimler" class="py-20 bg-white">
        <div class="max-w-6xl mx-auto px-4">
          <div class="max-w-2xl text-center mx-auto">
            <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">Kimler için</span>
            <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Sınıfın her tarafına bir hikâyeniz var.</h2>
            <p class="mt-3 text-slate-600 leading-relaxed">Üretici, denetleyici ve öğrenen için ayrı ayrı tasarlanmış deneyimler.</p>
          </div>
          <div class="mt-12 grid md:grid-cols-3 gap-5">
            @for (a of audiences; track a.title) {
              <article class="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col hover:border-brand-300 hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white inline-flex items-center justify-center mb-4 shadow-md shadow-brand-600/20">
                  <mat-icon style="font-size:24px;width:24px;height:24px">{{ a.icon }}</mat-icon>
                </div>
                <h3 class="font-semibold text-slate-900 text-lg">{{ a.title }}</h3>
                <ul class="mt-4 space-y-2 text-sm text-slate-600 flex-1">
                  @for (b of a.bullets; track b) {
                    <li class="flex gap-2">
                      <mat-icon class="!text-brand-600 mt-0.5 flex-shrink-0" style="font-size:16px;width:16px;height:16px">check_circle</mat-icon>
                      <span>{{ b }}</span>
                    </li>
                  }
                </ul>
                <a [routerLink]="a.ctaTo" class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 group">
                  {{ a.ctaLabel }}
                  <mat-icon class="transition group-hover:translate-x-0.5" style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
                </a>
              </article>
            }
          </div>
        </div>
      </section>

      <!-- TRUST -->
      <section class="py-20 bg-slate-50">
        <div class="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div class="max-w-2xl text-left">
              <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">Güven & altyapı</span>
              <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Üretim seviyesinde mimari, eğitim seviyesinde sadelik.</h2>
              <p class="mt-3 text-slate-600 leading-relaxed">Mikroservisler, event-driven iletişim, mesaj kuyruğu, denetlenebilir audit log ve sandbox iframe ile güvenliğin hiçbir köşesini şansa bırakmadık.</p>
            </div>
            <ul class="mt-6 space-y-3 text-sm text-slate-700">
              @for (t of trustBullets; track t) {
                <li class="flex gap-2">
                  <mat-icon class="!text-brand-600 mt-0.5 flex-shrink-0" style="font-size:16px;width:16px;height:16px">check_circle</mat-icon>
                  <span>{{ t }}</span>
                </li>
              }
            </ul>
          </div>
          <div class="relative">
            <div class="absolute -inset-4 bg-gradient-to-tr from-brand-200/40 to-accent-500/10 rounded-3xl blur-2xl" aria-hidden="true"></div>
            <div class="relative grid grid-cols-2 gap-3">
              @for (t of techStack; track t.k) {
                <div class="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand-300 transition">
                  <div class="text-sm font-bold text-slate-900">{{ t.k }}</div>
                  <div class="text-xs text-slate-500">{{ t.v }}</div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-20">
        <div class="max-w-5xl mx-auto px-4">
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-12 md:px-12 md:py-16 text-white shadow-2xl shadow-brand-900/20">
            <div class="absolute inset-0 bg-grid-slate opacity-10" style="background-size:24px 24px" aria-hidden="true"></div>
            <div class="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-accent-500/30 blur-3xl" aria-hidden="true"></div>
            <div class="relative grid md:grid-cols-3 gap-6 items-center">
              <div class="md:col-span-2">
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium">
                  <mat-icon style="font-size:14px;width:14px;height:14px">rocket_launch</mat-icon>
                  Beta erişimi açık
                </span>
                <h2 class="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">Sınıfınıza yeni bir nefes katmaya hazır mısınız?</h2>
                <p class="mt-3 text-white/90 max-w-xl">Bir öğretmen olarak ilk içeriğinizi 5 dakikada yayınlayın. AI ön inceleme ve editör onayı arka planda çalışsın, siz öğrencilerinize odaklanın.</p>
              </div>
              <div class="flex flex-col gap-3">
                <a routerLink="/register" class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 shadow">
                  Hemen başla
                  <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
                </a>
                <a routerLink="/discover" class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10">Önce göz at</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent {
  readonly bullets = ['Kayıt için kart bilgisi yok', 'MEB kazanım kodları ile eşleşme', 'Sandbox iframe ile %100 izole oynatma'];

  readonly scores: Score[] = [
    { label: 'Müfredat uyumu', value: 94, tone: 'emerald' },
    { label: 'Güvenlik (statik analiz)', value: 100, tone: 'brand' },
    { label: 'Erişilebilirlik', value: 78, tone: 'amber' },
    { label: 'Pedagojik kalite', value: 86, tone: 'brand' },
  ];

  readonly stats: Stat[] = [
    { value: '11', label: 'Mikroservis, 1 platform' },
    { value: '100%', label: 'AI ön incelemeden geçer' },
    { value: 'K-12', label: 'Tüm sınıf kademeleri' },
    { value: 'MEB', label: 'Müfredat eşlemesi' },
  ];

  readonly features: Feature[] = [
    { icon: 'memory', title: 'AI ön inceleme', desc: 'DeepSeek destekli statik+anlamsal analiz; içerik yüklenir yüklenmez güvenlik, MEB uyumu ve öğrenme hedefleri otomatik puanlanır.' },
    { icon: 'verified_user', title: 'Editör onayı', desc: 'AI raporu editöre delillerle birlikte iletilir; sadece müfredata ve güvenliğe uygun içerikler yayına çıkar.' },
    { icon: 'layers', title: 'Sandboxed oynatma', desc: 'Tüm interaktif HTML/JS içerikler izole sandbox iframe\'de çalışır. Cihazınız ve verileriniz her zaman korunur.' },
    { icon: 'menu_book', title: 'MEB kazanımları ile eşleşme', desc: 'Her içerik sınıf, ders, ünite ve kazanım koduna bağlanır. Öğretmenler kazanıma göre filtreleyip ders planına ekler.' },
    { icon: 'search', title: 'Hızlı keşif', desc: 'Elasticsearch tabanlı arama ile başlık, açıklama, etiket ve kazanım üzerinden saniyeler içinde uygun içeriği bulun.' },
    { icon: 'auto_awesome', title: 'Bildirimler ve ilerleme', desc: 'İçerik yüklendiğinde, AI kararı verildiğinde, editörden dönüş geldiğinde anlık bildirim — e-posta ve uygulama içi.' },
  ];

  readonly steps: Step[] = [
    { n: '01', title: 'Yükle', desc: 'HTML/JS interaktif içeriğinizi sürükleyip bırakın. Sınıf, ders ve kazanım kodlarını seçin.', icon: 'auto_fix_high' },
    { n: '02', title: 'AI inceler', desc: 'Statik analiz + LLM değerlendirmesi otomatik çalışır. Skorlama, riskler ve öneriler raporlanır.', icon: 'memory' },
    { n: '03', title: 'Editör onaylar', desc: 'İnsan editör AI kararını gözden geçirir, gerekirse revizyon ister. Onaylanan içerik anında yayında.', icon: 'rule' },
  ];

  readonly audiences: Audience[] = [
    {
      icon: 'school', title: 'Öğretmenler için',
      bullets: ['İçeriklerinizi yükleyin, kazanım kodlarına bağlayın', 'AI analizinden hızlı geri bildirim alın', 'Yayınlanan içeriği derste tek tıkla başlatın'],
      ctaLabel: 'Öğretmen olarak başla', ctaTo: '/register',
    },
    {
      icon: 'rule', title: 'Editörler için',
      bullets: ['AI raporu, statik analiz ve örnek ekran görüntüleri tek panelde', 'Onayla / revizyon iste / reddet kararını sayılarla destekle', 'Tüm karar geçmişi denetlenebilir audit log\'da'],
      ctaLabel: 'Editör paneline git', ctaTo: '/login',
    },
    {
      icon: 'group', title: 'Öğrenciler için',
      bullets: ['Sınıfınıza ve dersinize göre filtrelenmiş içerikler', 'Sandbox iframe ile güvenli oynatma', 'Öğretmen tarafından önerilen kazanım odaklı liste'],
      ctaLabel: 'İçerikleri keşfet', ctaTo: '/discover',
    },
  ];

  readonly trustBullets = [
    '.NET 10 mikroservisler + YARP API Gateway',
    'RabbitMQ + MassTransit + CloudEvents 1.0 ile event mimarisi',
    'PostgreSQL, MongoDB, Elasticsearch, Redis: doğru veri için doğru depo',
    'OpenTelemetry + Loki + Prometheus + Grafana ile gözlemlenebilirlik',
    'KVKK uyumlu veri saklama, dışa aktarım ve anonimleştirme',
  ];

  readonly techStack = [
    { k: '.NET 10', v: 'API katmanı' },
    { k: 'Angular 21', v: 'Frontend' },
    { k: 'DeepSeek', v: 'LLM moderasyon' },
    { k: 'Elasticsearch', v: 'Arama' },
    { k: 'PostgreSQL', v: 'İlişkisel veri' },
    { k: 'RabbitMQ', v: 'Event bus' },
  ];
}
