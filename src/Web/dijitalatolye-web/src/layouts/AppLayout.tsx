import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/state/auth";

export default function AppLayout() {
  const navigate = useNavigate();
  const { email, roles, logout } = useAuthStore();
  const isEditor = roles.includes("Editor") || roles.includes("Admin") || roles.includes("SuperAdmin");
  const isTeacher = roles.includes("Teacher") || isEditor;
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-brand-600">DijitalAtölye</Link>
          <nav className="flex items-center gap-4 text-sm">
            {isTeacher && <NavLink to="/teacher/contents/new" className={({ isActive }) => isActive ? "text-brand-600" : "hover:text-brand-600"}>İçerik Yükle</NavLink>}
            {isEditor && <NavLink to="/editor/queue" className={({ isActive }) => isActive ? "text-brand-600" : "hover:text-brand-600"}>Editör Kuyruğu</NavLink>}
            <span className="text-slate-500">{email}</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300"
            >Çıkış</button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6"><Outlet /></main>
    </div>
  );
}
