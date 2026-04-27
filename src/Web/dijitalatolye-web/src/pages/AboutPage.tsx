import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Cpu, Users, BookOpen, Heart, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white" aria-hidden />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-700">Hakkımızda</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Türkiye'nin <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-accent-500">öğretmen üretici</span> dijital içerik platformu
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            DijitalAtölye, K-12 öğretmenlerinin ürettiği interaktif HTML/JS içerikleri AI ön incelemesinden geçirip
            editör onayıyla yayınlayan, MEB müfredatına bağlı, sandbox güvenli bir açık eğitim platformudur.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex w-12 h-12 rounded-xl bg-brand-100 text-brand-700 items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Misyonumuz</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Türkiye'deki her sınıfa, müfredata uygun ve güvenli interaktif içerikleri saniyeler içinde ulaştırmak.
            Öğretmenlerin yaratıcılığını çoğaltmak, öğrencilere zengin dijital deneyimler sunmak.
          </p>
        </div>
        <div>
          <div className="inline-flex w-12 h-12 rounded-xl bg-accent-100 text-accent-600 items-center justify-center mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Vizyonumuz</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Türkiye'nin en geniş açık dijital eğitim içerik kütüphanesi olmak. Her öğretmenin üretici, her öğrencinin
            keşfeden, her ailenin güvenen olduğu bir ekosistem inşa etmek.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center">Değerlerimiz</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-300 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-3">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Yolculuğumuza katılın</h2>
          <p className="mt-3 text-slate-600">İçerik üretmek, denetlemek veya keşfetmek — yeriniz hazır.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20">
              Hesap aç <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/discover" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700">
              İçerikleri keşfet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const values = [
  { icon: ShieldCheck, title: "Güvenlik önce", desc: "Her içerik AI + statik analiz + sandbox iframe ile çocuklarınız için izole çalışır." },
  { icon: Cpu, title: "Akıllı moderasyon", desc: "AI ön inceleme; pedagojik kalite, müfredat uyumu ve risk değerlendirmesi otomatik raporlanır." },
  { icon: BookOpen, title: "Müfredata bağlı", desc: "Her içerik MEB kazanım koduna eşlenir; öğretmen kazanıma göre filtreler." },
  { icon: Users, title: "Şeffaf süreç", desc: "AI raporu, editör kararı, audit log — her adım izlenebilir ve denetlenebilir." },
];
