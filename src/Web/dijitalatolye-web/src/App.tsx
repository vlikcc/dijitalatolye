import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TeacherUploadPage from "@/pages/teacher/TeacherUploadPage";
import TeacherUploadWizard from "@/pages/teacher/TeacherUploadWizard";
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import TeacherMyContentsPage from "@/pages/teacher/TeacherMyContentsPage";
import TeacherContentDetailPage from "@/pages/teacher/TeacherContentDetailPage";
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
import RequireAuth from "@/components/RequireAuth";
import RoleGuard from "@/components/RoleGuard";

const ADMIN_ROLES = ["Admin", "SuperAdmin"];
const EDITOR_ROLES = ["Editor", "Admin", "SuperAdmin"];
const TEACHER_ROLES = ["Teacher", "Editor", "Admin", "SuperAdmin"];

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/category/:subject" element={<CategoryPage />} />
        <Route path="/contents/:slug" element={<ContentDetailPage />} />
        <Route path="/play/:slug" element={<PlayPage />} />
        <Route path="/kvkk" element={<KvkkPage />} />
      </Route>

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="/teacher/dashboard" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><TeacherDashboardPage /></RoleGuard>} />
        <Route path="/teacher/contents" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><TeacherMyContentsPage /></RoleGuard>} />
        <Route path="/teacher/contents/new" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><TeacherUploadPage /></RoleGuard>} />
        <Route path="/teacher/contents/wizard" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><TeacherUploadWizard /></RoleGuard>} />
        <Route path="/teacher/contents/:id" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><TeacherContentDetailPage /></RoleGuard>} />
        <Route path="/teacher/profile" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><TeacherProfilePage /></RoleGuard>} />
        <Route path="/teacher/collections" element={<RoleGuard roles={TEACHER_ROLES} fallbackTo="/"><CollectionsPage /></RoleGuard>} />
        <Route path="/editor" element={<RoleGuard roles={EDITOR_ROLES} fallbackTo="/"><EditorDashboardPage /></RoleGuard>} />
        <Route path="/editor/queue" element={<RoleGuard roles={EDITOR_ROLES} fallbackTo="/"><EditorQueuePage /></RoleGuard>} />
        <Route path="/editor/review/:id" element={<RoleGuard roles={EDITOR_ROLES} fallbackTo="/"><EditorReviewPage /></RoleGuard>} />
        <Route path="/editor/history" element={<RoleGuard roles={EDITOR_ROLES} fallbackTo="/"><EditorHistoryPage /></RoleGuard>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminDashboardPage /></RoleGuard>} />
        <Route path="/admin/contents" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminContentsPage /></RoleGuard>} />
        <Route path="/admin/users" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminUsersPage /></RoleGuard>} />
        <Route path="/admin/catalog" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminCatalogPage /></RoleGuard>} />
        <Route path="/admin/ai" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminAiConfigPage /></RoleGuard>} />
        <Route path="/admin/audit" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminAuditPage /></RoleGuard>} />
        <Route path="/admin/reports" element={<RoleGuard roles={ADMIN_ROLES} fallbackTo="/"><AdminReportsPage /></RoleGuard>} />
        <Route path="/account/delete" element={<AccountDeletePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
