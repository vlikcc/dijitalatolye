import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Sparkles, Bell, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/state/auth";

export default function AppLayout() {
  const navigate = useNavigate();
  const { email, roles, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");
  const isEditor = isAdmin || roles.includes("Editor");
  const isTeacher = isEditor || roles.includes("Teacher");

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:text-brand-700 hover:bg-brand-50"
    }`;

  return (
    <div className="min-h-full flex flex-col bg-slate-50">
      <header className="bg-white border-b border-brand-100/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-700 shrink-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline">DijitalAtölye</span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {isTeacher && (
              <>
                <NavLink to="/teacher/dashboard" className={linkCls}>Panel</NavLink>
                <NavLink to="/teacher/contents" className={linkCls}>İçeriklerim</NavLink>
                <NavLink to="/teacher/contents/wizard" className={linkCls}>Yükle</NavLink>
              </>
            )}
            {isEditor && (
              <>
                <NavLink to="/editor" className={linkCls} end>Editör</NavLink>
                <NavLink to="/editor/queue" className={linkCls}>Kuyruk</NavLink>
              </>
            )}
            {isAdmin && <NavLink to="/admin" className={linkCls} end>Yönetim</NavLink>}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <NavLink to="/notifications"
              className={({ isActive }) =>
                `inline-flex items-center justify-center w-9 h-9 rounded-lg transition ${
                  isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                }`
              }
              aria-label="Bildirimler">
              <Bell className="w-4 h-4" />
            </NavLink>

            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-50 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold flex items-center justify-center">
                  {(email ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm">{email}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Giriş yapan</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{roles.join(", ") || "—"}</p>
                    </div>
                    {isTeacher && (
                      <Link to="/teacher/profile" onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50">
                        Profilim
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin/reports" onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50">
                        Raporlar
                      </Link>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); logout(); navigate("/login"); }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 inline-flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Çıkış
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6"><Outlet /></main>
    </div>
  );
}
