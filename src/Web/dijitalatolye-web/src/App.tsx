import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TeacherUploadPage from "@/pages/teacher/TeacherUploadPage";
import TeacherUploadWizard from "@/pages/teacher/TeacherUploadWizard";
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import TeacherMyContentsPage from "@/pages/teacher/TeacherMyContentsPage";
import TeacherProfilePage from "@/pages/teacher/TeacherProfilePage";
import CollectionsPage from "@/pages/teacher/CollectionsPage";
import EditorQueuePage from "@/pages/editor/EditorQueuePage";
import EditorReviewPage from "@/pages/editor/EditorReviewPage";
import EditorDashboardPage from "@/pages/editor/EditorDashboardPage";
import EditorHistoryPage from "@/pages/editor/EditorHistoryPage";
import PlayPage from "@/pages/PlayPage";
import NotificationsPage from "@/pages/NotificationsPage";
import DiscoverPage from "@/pages/DiscoverPage";
import CategoryPage from "@/pages/CategoryPage";
import ContentDetailPage from "@/pages/ContentDetailPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminContentsPage from "@/pages/admin/AdminContentsPage";
import AdminCatalogPage from "@/pages/admin/AdminCatalogPage";
import AdminAiConfigPage from "@/pages/admin/AdminAiConfigPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import KvkkPage from "@/pages/KvkkPage";
import AccountDeletePage from "@/pages/AccountDeletePage";
import { useAuthStore } from "@/state/auth";

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/category/:subject" element={<CategoryPage />} />
        <Route path="/contents/:slug" element={<ContentDetailPage />} />
        <Route path="/play/:slug" element={<PlayPage />} />
        <Route path="/kvkk" element={<KvkkPage />} />
      </Route>

      <Route element={accessToken ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
        <Route path="/teacher/contents" element={<TeacherMyContentsPage />} />
        <Route path="/teacher/contents/new" element={<TeacherUploadPage />} />
        <Route path="/teacher/contents/wizard" element={<TeacherUploadWizard />} />
        <Route path="/teacher/profile" element={<TeacherProfilePage />} />
        <Route path="/teacher/collections" element={<CollectionsPage />} />
        <Route path="/editor" element={<EditorDashboardPage />} />
        <Route path="/editor/queue" element={<EditorQueuePage />} />
        <Route path="/editor/review/:id" element={<EditorReviewPage />} />
        <Route path="/editor/history" element={<EditorHistoryPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/contents" element={<AdminContentsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/catalog" element={<AdminCatalogPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/ai" element={<AdminAiConfigPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/account/delete" element={<AccountDeletePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
