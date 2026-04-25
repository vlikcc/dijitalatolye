import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Cpu,
  Layers,
  GraduationCap,
  ClipboardCheck,
  Users,
  Rocket,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  Search,
  Wand2,
} from "lucide-react";

const features: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }[] = [
  {
    icon: Cpu,
    title: "AI ön inceleme",
    desc: "DeepSeek destekli statik+anlamsal analiz; içerik yüklenir yüklenmez güvenlik, MEB uyumu ve öğrenme hedefleri otomatik puanlanır.",
  },
  {
    icon: ShieldCheck,
    title: "Editör onayı",
    desc: "AI raporu editöre delillerle birlikte iletilir; sadece müfredata ve güvenliğe uygun içerikler yayına çıkar.",
  },
  {
    icon: Layers,
    title: "Sandboxed oynatma",
    desc: "Tüm interaktif HTML/JS içerikler izole sandbox iframe'de çalışır. Cihazınız ve verileriniz her zaman korunur.",
  },
  {
    icon: BookOpen,
    title: "MEB kazanımları ile eşleşme",
    desc: "Her içerik sınıf, ders, ünite ve kazanım koduna bağlanır. Öğretmenler kazanıma göre filtreleyip ders planına ekler.",
  },
  {
    icon: Search,
    title: "Hızlı keşif",
    desc: "Elasticsearch tabanlı arama ile başlık, açıklama, etiket ve kazanım üzerinden saniyeler içinde uygun içeriği bulun.",
  },
  {
    icon: Sparkles,
    title: "Bildirimler ve ilerleme",
    desc: "İçerik yüklendiğinde, AI kararı verildiğinde, editörden dönüş geldiğinde anlık bildirim — e-posta ve uygulama içi.",
  },
];

const steps: { n: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    n: "01",
    title: "Yükle",
    desc: "HTML/JS interaktif içeriğinizi sürükleyip bırakın. Sınıf, ders ve kazanım kodlarını seçin.",
    icon: Wand2,
  },
  {
    n: "02",
    title: "AI inceler",
    desc: "Statik analiz + LLM değerlendirmesi otomatik çalışır. Skorlama, riskler ve öneriler raporlanır.",
    icon: Cpu,
  },
  {
    n: "03",
    title: "Editör onaylar",
    desc: "İnsan editör AI kararını gözden geçirir, gerekirse revizyon ister. Onaylanan içerik anında yayında.",
    icon: ClipboardCheck,
  },
];

const audiences: { icon: React.ComponentType<{ className?: string }>; title: string; bullets: string[]; cta: { label: string; to: string } }[] = [
  {
    icon: GraduationCap,
    title: "Öğretmenler için",
    bullets: [
      "İçeriklerinizi yükleyin, kazanım kodlarına bağlayın",
      "AI analizinden hızlı geri bildirim alın",
      "Yayınlanan içeriği derste tek tıkla başlatın",
    ],
    cta: { label: "Öğretmen olarak başla", to: "/register" },
  },
  {
    icon: ClipboardCheck,
    title: "Editörler için",
    bullets: [
      "AI raporu, statik analiz ve örnek ekran görüntüleri tek panelde",
      "Onayla / revizyon iste / reddet kararını sayılarla destekle",
      "Tüm karar geçmişi denetlenebilir audit log'da",
    ],
    cta: { label: "Editör paneline git", to: "/login" },
  },
  {
    icon: Users,
    title: "Öğrenciler için",
    bullets: [
      "Sınıfınıza ve dersinize göre filtrelenmiş içerikler",
      "Sandbox iframe ile güvenli oynatma",
      "Öğretmen tarafından önerilen kazanım odaklı liste",
    ],
    cta: { label: "İçerikleri keşfet", to: "/discover" },
  },
];

const stats: { value: string; label: string }[] = [
  { value: "11", label: "Mikroservis, 1 platform" },
  { value: "100%", label: "AI ön incelemeden geçer" },
  { value: "K-12", label: "Tüm sınıf kademeleri" },
  { value: "MEB", label: "Müfredat eşlemesi" },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white" aria-hidden />
        <div className="absolute inset-0 bg-grid-slate [background-size:32px_32px] opacity-40" aria-hidden />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden />
        <div className="absolute top-32 -right-32 w-[28rem] h-[28rem] bg-accent-500/10 rounded-full blur-3xl" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-100 text-brand-700 text-xs font-medium shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> AI destekli, editör onaylı, sandbox güvenli
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              MEB müfredatına uygun, <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-accent-500">güvenli dijital içerikler</span> bir tık uzakta
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
              DijitalAtölye, K-12 öğretmenlerinin ürettiği interaktif HTML içerikleri AI ön incelemesinden geçirir,
              editör onayıyla yayınlar ve öğrencilere sınıf-ders-kazanım bazlı sunar. Tek platform, tüm süreç şeffaf.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition"
              >
                Ücretsiz hesap aç
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:border-brand-300 hover:text-brand-700 transition"
              >
                <PlayCircle className="w-4 h-4" />
                İçerikleri keşfet
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {[
                "Kayıt için kart bilgisi yok",
                "MEB kazanım kodları ile eşleşme",
                "Sandbox iframe ile %100 izole oynatma",
              ].map((t) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Sağdaki görsel: AI rapor kart mockup */}
          <div className="lg:col-span-5 animate-fade-up [animation-delay:120ms]">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-brand-200/60 via-white to-accent-500/20 rounded-3xl blur-2xl" aria-hidden />
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-brand-900/5 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  </div>
                  <span className="ml-2 text-xs text-slate-500 font-medium">moderation-report.json</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">İçerik</p>
                      <p className="font-semibold text-slate-900">5. Sınıf • Doğal Sayılar</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      AI: Onay önerisi
                    </span>
                  </div>
                  <ScoreBar label="Müfredat uyumu" value={94} tone="emerald" />
                  <ScoreBar label="Güvenlik (statik analiz)" value={100} tone="brand" />
                  <ScoreBar label="Erişilebilirlik" value={78} tone="amber" />
                  <ScoreBar label="Pedagojik kalite" value={86} tone="brand" />
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                    <Mini stat="0" label="Kritik risk" />
                    <Mini stat="2" label="Uyarı" />
                    <Mini stat="M.5.1.1.1" label="Kazanım" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden md:block animate-float-slow">
                <div className="rounded-xl bg-white border border-slate-200 shadow-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 inline-flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Editör kararı</p>
                    <p className="text-sm font-semibold text-slate-900">Onaylandı, yayında</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/70 backdrop-blur border border-slate-200 px-4 py-3 text-center">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            eyebrow="Platform"
            title="Üreten öğretmene, koruyan platforma ihtiyaç var."
            subtitle="DijitalAtölye, içerik üretimi ile öğrenci güvenliği arasındaki dengeyi mühendislikle kurar. AI hız verir, editör güvence verir, sandbox koruma verir."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/5 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="nasil-calisir" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            eyebrow="Nasıl çalışır"
            title="Yükleme'den yayına 3 adım."
            subtitle="Üretmek isteyene maksimum hız, koruma altında olan öğrenciye maksimum güvenlik."
          />
          <div className="mt-14 relative">
            <div className="hidden md:block absolute top-12 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" aria-hidden />
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                  <div className="absolute -top-5 left-6 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white inline-flex items-center justify-center font-bold shadow-lg shadow-brand-600/30">
                    {s.n}
                  </div>
                  <div className="pt-4">
                    <s.icon className="w-6 h-6 text-brand-600" />
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section id="kimler" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            eyebrow="Kimler için"
            title="Sınıfın her tarafına bir hikâyeniz var."
            subtitle="Üretici, denetleyici ve öğrenen için ayrı ayrı tasarlanmış deneyimler."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {audiences.map((a) => (
              <article
                key={a.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col hover:border-brand-300 hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white inline-flex items-center justify-center mb-4 shadow-md shadow-brand-600/20">
                  <a.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">{a.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
                  {a.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={a.cta.to}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 group"
                >
                  {a.cta.label}
                  <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / TECH */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Güven & altyapı"
              title="Üretim seviyesinde mimari, eğitim seviyesinde sadelik."
              subtitle="Mikroservisler, event-driven iletişim, mesaj kuyruğu, denetlenebilir audit log ve sandbox iframe ile güvenliğin hiçbir köşesini şansa bırakmadık."
            />
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {[
                ".NET 10 mikroservisler + YARP API Gateway",
                "RabbitMQ + MassTransit + CloudEvents 1.0 ile event mimarisi",
                "PostgreSQL, MongoDB, Elasticsearch, Redis: doğru veri için doğru depo",
                "OpenTelemetry + Loki + Prometheus + Grafana ile gözlemlenebilirlik",
                "KVKK uyumlu veri saklama, dışa aktarım ve anonimleştirme",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-200/40 to-accent-500/10 rounded-3xl blur-2xl" aria-hidden />
            <div className="relative grid grid-cols-2 gap-3">
              {[
                { k: ".NET 10", v: "API katmanı" },
                { k: "React 19", v: "Frontend" },
                { k: "DeepSeek", v: "LLM moderasyon" },
                { k: "Elasticsearch", v: "Arama" },
                { k: "PostgreSQL", v: "İlişkisel veri" },
                { k: "RabbitMQ", v: "Event bus" },
              ].map((t) => (
                <div key={t.k} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand-300 transition">
                  <div className="text-sm font-bold text-slate-900">{t.k}</div>
                  <div className="text-xs text-slate-500">{t.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-12 md:px-12 md:py-16 text-white shadow-2xl shadow-brand-900/20">
            <div className="absolute inset-0 bg-grid-slate [background-size:24px_24px] opacity-10" aria-hidden />
            <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-accent-500/30 blur-3xl" aria-hidden />
            <div className="relative grid md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium">
                  <Rocket className="w-3.5 h-3.5" /> Beta erişimi açık
                </span>
                <h2 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
                  Sınıfınıza yeni bir nefes katmaya hazır mısınız?
                </h2>
                <p className="mt-3 text-white/90 max-w-xl">
                  Bir öğretmen olarak ilk içeriğinizi 5 dakikada yayınlayın. AI ön inceleme ve editör onayı arka planda
                  çalışsın, siz öğrencilerinize odaklanın.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 shadow"
                >
                  Hemen başla
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10"
                >
                  Önce göz at
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-600 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function ScoreBar({ label, value, tone }: { label: string; value: number; tone: "brand" | "emerald" | "amber" }) {
  const colorMap: Record<typeof tone, string> = {
    brand: "from-brand-500 to-brand-700",
    emerald: "from-emerald-400 to-emerald-600",
    amber: "from-amber-400 to-amber-600",
  };
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${colorMap[tone]} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Mini({ stat, label }: { stat: string; label: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-900">{stat}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
