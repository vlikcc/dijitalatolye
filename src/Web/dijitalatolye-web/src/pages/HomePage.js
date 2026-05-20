import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ShieldCheck, Sparkles, Cpu, Layers, GraduationCap, ClipboardCheck, Users, Rocket, PlayCircle, CheckCircle2, BookOpen, Search, Wand2, } from "lucide-react";
const features = [
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
const steps = [
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
const audiences = [
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
const stats = [
    { value: "11", label: "Mikroservis, 1 platform" },
    { value: "100%", label: "AI ön incelemeden geçer" },
    { value: "K-12", label: "Tüm sınıf kademeleri" },
    { value: "MEB", label: "Müfredat eşlemesi" },
];
export default function HomePage() {
    return (_jsxs("div", { className: "bg-white", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "DijitalAt\u00F6lye \u2014 MEB uyumlu dijital e\u011Fitim platformu" }), _jsx("meta", { name: "description", content: "AI destekli \u00F6n inceleme ve edit\u00F6r onayl\u0131 dijital e\u011Fitim i\u00E7erikleri. \u00D6\u011Fretmenler y\u00FCkler, \u00F6\u011Frenciler ke\u015Ffeder." }), _jsx("meta", { property: "og:title", content: "DijitalAt\u00F6lye" }), _jsx("meta", { property: "og:description", content: "MEB m\u00FCfredat\u0131na uygun dijital e\u011Fitim i\u00E7erikleri platformu" }), _jsx("meta", { property: "og:type", content: "website" })] }), _jsxs("section", { className: "relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white", "aria-hidden": true }), _jsx("div", { className: "absolute inset-0 bg-grid-slate [background-size:32px_32px] opacity-40", "aria-hidden": true }), _jsx("div", { className: "absolute -top-24 -left-24 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl", "aria-hidden": true }), _jsx("div", { className: "absolute top-32 -right-32 w-[28rem] h-[28rem] bg-accent-500/10 rounded-full blur-3xl", "aria-hidden": true }), _jsxs("div", { className: "relative max-w-6xl mx-auto px-4 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center", children: [_jsxs("div", { className: "lg:col-span-7 animate-fade-up", children: [_jsxs("span", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-100 text-brand-700 text-xs font-medium shadow-sm", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5" }), " AI destekli, edit\u00F6r onayl\u0131, sandbox g\u00FCvenli"] }), _jsxs("h1", { className: "mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]", children: ["MEB m\u00FCfredat\u0131na uygun, ", _jsx("span", { className: "bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-accent-500", children: "g\u00FCvenli dijital i\u00E7erikler" }), " bir t\u0131k uzakta"] }), _jsx("p", { className: "mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed", children: "DijitalAt\u00F6lye, K-12 \u00F6\u011Fretmenlerinin \u00FCretti\u011Fi interaktif HTML i\u00E7erikleri AI \u00F6n incelemesinden ge\u00E7irir, edit\u00F6r onay\u0131yla yay\u0131nlar ve \u00F6\u011Frencilere s\u0131n\u0131f-ders-kazan\u0131m bazl\u0131 sunar. Tek platform, t\u00FCm s\u00FCre\u00E7 \u015Feffaf." }), _jsxs("div", { className: "mt-8 flex flex-col sm:flex-row gap-3", children: [_jsxs(Link, { to: "/register", className: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition", children: ["\u00DCcretsiz hesap a\u00E7", _jsx(ArrowRight, { className: "w-4 h-4" })] }), _jsxs(Link, { to: "/discover", className: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:border-brand-300 hover:text-brand-700 transition", children: [_jsx(PlayCircle, { className: "w-4 h-4" }), "\u0130\u00E7erikleri ke\u015Ffet"] })] }), _jsx("ul", { className: "mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600", children: [
                                            "Kayıt için kart bilgisi yok",
                                            "MEB kazanım kodları ile eşleşme",
                                            "Sandbox iframe ile %100 izole oynatma",
                                        ].map((t) => (_jsxs("li", { className: "inline-flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-brand-600" }), " ", t] }, t))) })] }), _jsx("div", { className: "lg:col-span-5 animate-fade-up [animation-delay:120ms]", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute -inset-6 bg-gradient-to-tr from-brand-200/60 via-white to-accent-500/20 rounded-3xl blur-2xl", "aria-hidden": true }), _jsxs("div", { className: "relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-brand-900/5 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2", children: [_jsxs("div", { className: "flex gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-300" }), _jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-300" }), _jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-300" })] }), _jsx("span", { className: "ml-2 text-xs text-slate-500 font-medium", children: "moderation-report.json" })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "\u0130\u00E7erik" }), _jsx("p", { className: "font-semibold text-slate-900", children: "5. S\u0131n\u0131f \u2022 Do\u011Fal Say\u0131lar" })] }), _jsx("span", { className: "px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200", children: "AI: Onay \u00F6nerisi" })] }), _jsx(ScoreBar, { label: "M\u00FCfredat uyumu", value: 94, tone: "emerald" }), _jsx(ScoreBar, { label: "G\u00FCvenlik (statik analiz)", value: 100, tone: "brand" }), _jsx(ScoreBar, { label: "Eri\u015Filebilirlik", value: 78, tone: "amber" }), _jsx(ScoreBar, { label: "Pedagojik kalite", value: 86, tone: "brand" }), _jsxs("div", { className: "pt-2 border-t border-slate-100 grid grid-cols-3 gap-3 text-center", children: [_jsx(Mini, { stat: "0", label: "Kritik risk" }), _jsx(Mini, { stat: "2", label: "Uyar\u0131" }), _jsx(Mini, { stat: "M.5.1.1.1", label: "Kazan\u0131m" })] })] })] }), _jsx("div", { className: "absolute -bottom-6 -left-6 hidden md:block animate-float-slow", children: _jsxs("div", { className: "rounded-xl bg-white border border-slate-200 shadow-lg p-3 flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-brand-100 text-brand-700 inline-flex items-center justify-center", children: _jsx(ShieldCheck, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500", children: "Edit\u00F6r karar\u0131" }), _jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Onayland\u0131, yay\u0131nda" })] })] }) })] }) })] }), _jsx("div", { className: "relative max-w-6xl mx-auto px-4 pb-12", children: _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: stats.map((s) => (_jsxs("div", { className: "rounded-xl bg-white/70 backdrop-blur border border-slate-200 px-4 py-3 text-center", children: [_jsx("div", { className: "text-2xl font-extrabold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent", children: s.value }), _jsx("div", { className: "text-xs text-slate-600 mt-0.5", children: s.label })] }, s.label))) }) })] }), _jsx("section", { className: "py-20 bg-white", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx(SectionHeader, { eyebrow: "Platform", title: "\u00DCreten \u00F6\u011Fretmene, koruyan platforma ihtiya\u00E7 var.", subtitle: "DijitalAt\u00F6lye, i\u00E7erik \u00FCretimi ile \u00F6\u011Frenci g\u00FCvenli\u011Fi aras\u0131ndaki dengeyi m\u00FChendislikle kurar. AI h\u0131z verir, edit\u00F6r g\u00FCvence verir, sandbox koruma verir." }), _jsx("div", { className: "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: features.map((f) => (_jsxs("article", { className: "group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/5 transition", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-brand-50 text-brand-700 inline-flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition", children: _jsx(f.icon, { className: "w-5 h-5" }) }), _jsx("h3", { className: "font-semibold text-slate-900", children: f.title }), _jsx("p", { className: "mt-2 text-sm text-slate-600 leading-relaxed", children: f.desc })] }, f.title))) })] }) }), _jsx("section", { id: "nasil-calisir", className: "py-20 bg-gradient-to-b from-slate-50 to-white", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx(SectionHeader, { eyebrow: "Nas\u0131l \u00E7al\u0131\u015F\u0131r", title: "Y\u00FCkleme'den yay\u0131na 3 ad\u0131m.", subtitle: "\u00DCretmek isteyene maksimum h\u0131z, koruma alt\u0131nda olan \u00F6\u011Frenciye maksimum g\u00FCvenlik." }), _jsxs("div", { className: "mt-14 relative", children: [_jsx("div", { className: "hidden md:block absolute top-12 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent", "aria-hidden": true }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: steps.map((s) => (_jsxs("div", { className: "relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm", children: [_jsx("div", { className: "absolute -top-5 left-6 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white inline-flex items-center justify-center font-bold shadow-lg shadow-brand-600/30", children: s.n }), _jsxs("div", { className: "pt-4", children: [_jsx(s.icon, { className: "w-6 h-6 text-brand-600" }), _jsx("h3", { className: "mt-3 text-lg font-semibold text-slate-900", children: s.title }), _jsx("p", { className: "mt-2 text-sm text-slate-600 leading-relaxed", children: s.desc })] })] }, s.n))) })] })] }) }), _jsx("section", { id: "kimler", className: "py-20 bg-white", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx(SectionHeader, { eyebrow: "Kimler i\u00E7in", title: "S\u0131n\u0131f\u0131n her taraf\u0131na bir hik\u00E2yeniz var.", subtitle: "\u00DCretici, denetleyici ve \u00F6\u011Frenen i\u00E7in ayr\u0131 ayr\u0131 tasarlanm\u0131\u015F deneyimler." }), _jsx("div", { className: "mt-12 grid md:grid-cols-3 gap-5", children: audiences.map((a) => (_jsxs("article", { className: "rounded-2xl border border-slate-200 bg-white p-6 flex flex-col hover:border-brand-300 hover:shadow-md transition", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white inline-flex items-center justify-center mb-4 shadow-md shadow-brand-600/20", children: _jsx(a.icon, { className: "w-6 h-6" }) }), _jsx("h3", { className: "font-semibold text-slate-900 text-lg", children: a.title }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-slate-600 flex-1", children: a.bullets.map((b) => (_jsxs("li", { className: "flex gap-2", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: b })] }, b))) }), _jsxs(Link, { to: a.cta.to, className: "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 group", children: [a.cta.label, _jsx(ArrowRight, { className: "w-4 h-4 transition group-hover:translate-x-0.5" })] })] }, a.title))) })] }) }), _jsx("section", { className: "py-20 bg-slate-50", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center", children: [_jsxs("div", { children: [_jsx(SectionHeader, { align: "left", eyebrow: "G\u00FCven & altyap\u0131", title: "\u00DCretim seviyesinde mimari, e\u011Fitim seviyesinde sadelik.", subtitle: "Mikroservisler, event-driven ileti\u015Fim, mesaj kuyru\u011Fu, denetlenebilir audit log ve sandbox iframe ile g\u00FCvenli\u011Fin hi\u00E7bir k\u00F6\u015Fesini \u015Fansa b\u0131rakmad\u0131k." }), _jsx("ul", { className: "mt-6 space-y-3 text-sm text-slate-700", children: [
                                        ".NET 10 mikroservisler + YARP API Gateway",
                                        "RabbitMQ + MassTransit + CloudEvents 1.0 ile event mimarisi",
                                        "PostgreSQL, MongoDB, Elasticsearch, Redis: doğru veri için doğru depo",
                                        "OpenTelemetry + Loki + Prometheus + Grafana ile gözlemlenebilirlik",
                                        "KVKK uyumlu veri saklama, dışa aktarım ve anonimleştirme",
                                    ].map((t) => (_jsxs("li", { className: "flex gap-2", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: t })] }, t))) })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute -inset-4 bg-gradient-to-tr from-brand-200/40 to-accent-500/10 rounded-3xl blur-2xl", "aria-hidden": true }), _jsx("div", { className: "relative grid grid-cols-2 gap-3", children: [
                                        { k: ".NET 10", v: "API katmanı" },
                                        { k: "React 19", v: "Frontend" },
                                        { k: "DeepSeek", v: "LLM moderasyon" },
                                        { k: "Elasticsearch", v: "Arama" },
                                        { k: "PostgreSQL", v: "İlişkisel veri" },
                                        { k: "RabbitMQ", v: "Event bus" },
                                    ].map((t) => (_jsxs("div", { className: "rounded-xl bg-white border border-slate-200 p-4 hover:border-brand-300 transition", children: [_jsx("div", { className: "text-sm font-bold text-slate-900", children: t.k }), _jsx("div", { className: "text-xs text-slate-500", children: t.v })] }, t.k))) })] })] }) }), _jsx("section", { className: "py-20", children: _jsx("div", { className: "max-w-5xl mx-auto px-4", children: _jsxs("div", { className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-12 md:px-12 md:py-16 text-white shadow-2xl shadow-brand-900/20", children: [_jsx("div", { className: "absolute inset-0 bg-grid-slate [background-size:24px_24px] opacity-10", "aria-hidden": true }), _jsx("div", { className: "absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-accent-500/30 blur-3xl", "aria-hidden": true }), _jsxs("div", { className: "relative grid md:grid-cols-3 gap-6 items-center", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsxs("span", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium", children: [_jsx(Rocket, { className: "w-3.5 h-3.5" }), " Beta eri\u015Fimi a\u00E7\u0131k"] }), _jsx("h2", { className: "mt-4 text-3xl md:text-4xl font-extrabold leading-tight", children: "S\u0131n\u0131f\u0131n\u0131za yeni bir nefes katmaya haz\u0131r m\u0131s\u0131n\u0131z?" }), _jsx("p", { className: "mt-3 text-white/90 max-w-xl", children: "Bir \u00F6\u011Fretmen olarak ilk i\u00E7eri\u011Finizi 5 dakikada yay\u0131nlay\u0131n. AI \u00F6n inceleme ve edit\u00F6r onay\u0131 arka planda \u00E7al\u0131\u015Fs\u0131n, siz \u00F6\u011Frencilerinize odaklan\u0131n." })] }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs(Link, { to: "/register", className: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 shadow", children: ["Hemen ba\u015Fla", _jsx(ArrowRight, { className: "w-4 h-4" })] }), _jsx(Link, { to: "/discover", className: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10", children: "\u00D6nce g\u00F6z at" })] })] })] }) }) })] }));
}
function SectionHeader({ eyebrow, title, subtitle, align = "center", }) {
    const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
    return (_jsxs("div", { className: `max-w-2xl ${alignCls}`, children: [eyebrow && (_jsx("span", { className: "inline-block text-xs font-semibold tracking-widest uppercase text-brand-700", children: eyebrow })), _jsx("h2", { className: "mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900", children: title }), subtitle && _jsx("p", { className: "mt-3 text-slate-600 leading-relaxed", children: subtitle })] }));
}
function ScoreBar({ label, value, tone }) {
    const colorMap = {
        brand: "from-brand-500 to-brand-700",
        emerald: "from-emerald-400 to-emerald-600",
        amber: "from-amber-400 to-amber-600",
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-slate-600", children: label }), _jsx("span", { className: "font-semibold text-slate-900", children: value })] }), _jsx("div", { className: "mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden", children: _jsx("div", { className: `h-full bg-gradient-to-r ${colorMap[tone]} rounded-full`, style: { width: `${value}%` } }) })] }));
}
function Mini({ stat, label }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-bold text-slate-900", children: stat }), _jsx("div", { className: "text-[11px] text-slate-500", children: label })] }));
}
