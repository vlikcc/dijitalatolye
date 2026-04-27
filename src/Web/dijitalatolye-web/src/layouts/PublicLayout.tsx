import { Link, NavLink, Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";

const navItems: { to: string; label: string }[] = [
  { to: "/discover", label: "Keşfet" },
  { to: "/about", label: "Hakkımızda" },
  { to: "/#nasil-calisir", label: "Nasıl Çalışır" },
  { to: "/#kimler", label: "Kimler İçin" },
];

export default function PublicLayout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-brand-100/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-700">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-700/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-base tracking-tight">DijitalAtölye</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="hover:text-brand-700 transition-colors font-medium"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-brand-700 px-3 py-2 rounded-lg">
              Giriş
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800 shadow-md shadow-brand-700/20"
            >
              Ücretsiz Kayıt
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-brand-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4 text-sm">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-white">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              DijitalAtölye
            </Link>
            <p className="mt-3 text-brand-200 max-w-md leading-relaxed">
              MEB müfredatına uygun, AI destekli ön incelemeden geçmiş, editör onaylı dijital eğitim
              içeriklerinin K-12 öğretmen ve öğrencileriyle buluştuğu açık platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Ürün</h4>
            <ul className="space-y-2">
              <li><Link to="/discover" className="hover:text-white">İçerik Keşfet</Link></li>
              <li><Link to="/teacher/contents/wizard" className="hover:text-white">İçerik Yükle</Link></li>
              <li><Link to="/register" className="hover:text-white">Hesap Aç</Link></li>
              <li><Link to="/about" className="hover:text-white">Hakkımızda</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Yasal</h4>
            <ul className="space-y-2">
              <li><Link to="/kvkk" className="hover:text-white">KVKK ve Verileriniz</Link></li>
              <li><a href="#" className="hover:text-white">Kullanım Koşulları</a></li>
              <li><a href="#" className="hover:text-white">İletişim</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-700/50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-brand-300">
            <span>© {new Date().getFullYear()} DijitalAtölye. Tüm hakları saklıdır.</span>
            <span>v1 • Türkiye</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
