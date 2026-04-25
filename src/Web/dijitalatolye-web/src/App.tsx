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
import AdminContentsPage from "@/pages/admin/AdminContentsPage";
import AdminCatalogPage from "@/pages/admin/AdminCatalogPage";
import AdminAiConfigPage from "@/pages/admin/AdminAiConfigPage";
import KvkkPage from "@/pages/KvkkPage";
import { useAuthStore } from "@/state/auth";

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/contents/:slug" element={<ContentDetailPage />} />
        <Route path="/play/:slug" element={<PlayPage />} />
      </Route>

      <Route element={accessToken ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/teacher/contents/new" element={<TeacherUploadPage />} />
        <Route path="/teacher/contents/wizard" element={<TeacherUploadWizard />} />
        <Route path="/editor/queue" element={<EditorQueuePage />} />
        <Route path="/editor/review/:id" element={<EditorReviewPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/contents" element={<AdminContentsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/catalog" element={<AdminCatalogPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/ai" element={<AdminAiConfigPage />} />
        <Route path="/kvkk" element={<KvkkPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
