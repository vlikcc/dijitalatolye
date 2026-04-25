import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/state/auth";
export default function AppLayout() {
    const navigate = useNavigate();
    const { email, roles, logout } = useAuthStore();
    const isEditor = roles.includes("Editor") || roles.includes("Admin") || roles.includes("SuperAdmin");
    const isTeacher = roles.includes("Teacher") || isEditor;
    return (_jsxs("div", { className: "min-h-full flex flex-col", children: [_jsx("header", { className: "bg-white border-b", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 h-14 flex items-center justify-between", children: [_jsx(Link, { to: "/", className: "font-bold text-brand-600", children: "DijitalAt\u00F6lye" }), _jsxs("nav", { className: "flex items-center gap-4 text-sm", children: [isTeacher && _jsx(NavLink, { to: "/teacher/contents/new", className: ({ isActive }) => isActive ? "text-brand-600" : "hover:text-brand-600", children: "\u0130\u00E7erik Y\u00FCkle" }), isEditor && _jsx(NavLink, { to: "/editor/queue", className: ({ isActive }) => isActive ? "text-brand-600" : "hover:text-brand-600", children: "Edit\u00F6r Kuyru\u011Fu" }), _jsx("span", { className: "text-slate-500", children: email }), _jsx("button", { onClick: () => { logout(); navigate("/login"); }, className: "px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300", children: "\u00C7\u0131k\u0131\u015F" })] })] }) }), _jsx("main", { className: "flex-1 max-w-6xl w-full mx-auto px-4 py-6", children: _jsx(Outlet, {}) })] }));
}
