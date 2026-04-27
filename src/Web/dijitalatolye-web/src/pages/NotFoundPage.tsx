import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50" aria-hidden />
      <div className="absolute -top-32 right-0 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" aria-hidden />
      <div className="relative text-center max-w-lg">
        <span className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white items-center justify-center shadow-lg shadow-brand-700/20">
          <Compass className="w-7 h-7" />
        </span>
        <h1 className="mt-6 text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-accent-500">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Sayfa bulunamadı</h2>
        <p className="mt-3 text-slate-600">
          Aradığınız sayfa kaldırılmış, taşınmış ya da hiç var olmamış olabilir. Ana sayfaya dönüp keşfe devam edin.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-600/20">
            <ArrowLeft className="w-4 h-4" /> Ana sayfa
          </Link>
          <Link to="/discover" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700 bg-white">
            İçerikleri keşfet
          </Link>
        </div>
      </div>
    </section>
  );
}
