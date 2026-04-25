import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import TeacherUploadPage from "@/pages/teacher/TeacherUploadPage";
import TeacherUploadWizard from "@/pages/teacher/TeacherUploadWizard";
import EditorQueuePage from "@/pages/editor/EditorQueuePage";
import EditorReviewPage from "@/pages/editor/EditorReviewPage";
import PlayPage from "@/pages/PlayPage";
import NotificationsPage from "@/pages/NotificationsPage";
import DiscoverPage from "@/pages/DiscoverPage";
import ContentDetailPage from "@/pages/ContentDetailPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import KvkkPage from "@/pages/KvkkPage";
import { useAuthStore } from "@/state/auth";
export default function App() {
    const accessToken = useAuthStore((s) => s.accessToken);
    return (_jsxs(Routes, { children: [_jsxs(Route, { element: _jsx(PublicLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/discover", element: _jsx(DiscoverPage, {}) }), _jsx(Route, { path: "/contents/:slug", element: _jsx(ContentDetailPage, {}) }), _jsx(Route, { path: "/play/:slug", element: _jsx(PlayPage, {}) })] }), _jsxs(Route, { element: accessToken ? _jsx(AppLayout, {}) : _jsx(Navigate, { to: "/login", replace: true }), children: [_jsx(Route, { path: "/teacher/contents/new", element: _jsx(TeacherUploadPage, {}) }), _jsx(Route, { path: "/teacher/contents/wizard", element: _jsx(TeacherUploadWizard, {}) }), _jsx(Route, { path: "/editor/queue", element: _jsx(EditorQueuePage, {}) }), _jsx(Route, { path: "/editor/review/:id", element: _jsx(EditorReviewPage, {}) }), _jsx(Route, { path: "/notifications", element: _jsx(NotificationsPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminDashboardPage, {}) }), _jsx(Route, { path: "/admin/audit", element: _jsx(AdminAuditPage, {}) }), _jsx(Route, { path: "/admin/users", element: _jsx(AdminUsersPage, {}) }), _jsx(Route, { path: "/kvkk", element: _jsx(KvkkPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
