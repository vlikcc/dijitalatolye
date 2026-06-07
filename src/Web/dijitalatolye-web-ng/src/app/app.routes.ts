import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home.component').then((m) => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('./features/public/about/about.component').then((m) => m.AboutComponent) },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent) },
      { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent) },
      { path: 'discover', loadComponent: () => import('./features/public/discover/discover.component').then((m) => m.DiscoverComponent) },
      { path: 'category/:subject', loadComponent: () => import('./features/public/category/category.component').then((m) => m.CategoryComponent) },
      { path: 'contents/:slug', loadComponent: () => import('./features/public/content-detail/content-detail.component').then((m) => m.ContentDetailComponent) },
      {
        path: 'account/delete',
        canActivate: [authGuard],
        loadComponent: () => import('./features/account/account-delete/account-delete.component').then((m) => m.AccountDeleteComponent),
      },
      { path: 'play/:slug', loadComponent: () => import('./features/public/play/play.component').then((m) => m.PlayComponent) },
      { path: 'kvkk', loadComponent: () => import('./features/public/kvkk/kvkk.component').then((m) => m.KvkkComponent) },
      {
        path: 'collections',
        canActivate: [authGuard],
        loadComponent: () => import('./features/public/collections/collections.component').then((m) => m.CollectionsComponent),
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      { path: 'teacher', pathMatch: 'full', redirectTo: 'teacher/dashboard' },
      {
        path: 'teacher/dashboard',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/dashboard/teacher-dashboard.component').then((m) => m.TeacherDashboardComponent),
      },
      {
        path: 'teacher/contents',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/my-contents/my-contents.component').then((m) => m.MyContentsComponent),
      },
      {
        path: 'teacher/contents/wizard',
        redirectTo: 'teacher/contents/new',
        pathMatch: 'full',
      },
      {
        path: 'teacher/contents/new',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/upload/upload.component').then((m) => m.UploadComponent),
      },
      {
        path: 'teacher/contents/:id',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/content-detail/teacher-content-detail.component').then((m) => m.TeacherContentDetailComponent),
      },
      {
        path: 'teacher/collections',
        redirectTo: '/collections',
        pathMatch: 'full',
      },
      {
        path: 'teacher/profile',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'teacher/assignments',
        pathMatch: 'full',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/assignments/assignments.component').then((m) => m.TeacherAssignmentsComponent),
      },
      {
        path: 'teacher/classes',
        pathMatch: 'full',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/classes/classes.component').then((m) => m.TeacherClassesComponent),
      },
      {
        path: 'teacher/classes/:id',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/classes/class-detail.component').then((m) => m.TeacherClassDetailComponent),
      },
      {
        path: 'teacher/assignments/:id',
        canActivate: [roleGuard(['Teacher', 'Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/teacher/assignments/assignment-detail.component').then((m) => m.TeacherAssignmentDetailComponent),
      },
      {
        path: 'editor',
        canActivate: [roleGuard(['Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/editor/dashboard/editor-dashboard.component').then((m) => m.EditorDashboardComponent),
      },
      {
        path: 'editor/queue',
        canActivate: [roleGuard(['Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/editor/queue/editor-queue.component').then((m) => m.EditorQueueComponent),
      },
      {
        path: 'editor/review/:id',
        canActivate: [roleGuard(['Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/editor/review/editor-review.component').then((m) => m.EditorReviewComponent),
      },
      {
        path: 'editor/history',
        canActivate: [roleGuard(['Editor', 'Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/editor/history/editor-history.component').then((m) => m.EditorHistoryComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'progress',
        loadComponent: () => import('./features/student/progress/progress.component').then((m) => m.ProgressComponent),
      },
      {
        path: 'assignments',
        loadComponent: () => import('./features/student/assignments/assignments.component').then((m) => m.StudentAssignmentsComponent),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'admin/contents',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/contents/admin-contents.component').then((m) => m.AdminContentsComponent),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'admin/catalog',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/catalog/admin-catalog.component').then((m) => m.AdminCatalogComponent),
      },
      {
        path: 'admin/audit',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/audit/admin-audit.component').then((m) => m.AdminAuditComponent),
      },
      {
        path: 'admin/ai',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/ai-config/admin-ai-config.component').then((m) => m.AdminAiConfigComponent),
      },
      {
        path: 'admin/reports',
        canActivate: [roleGuard(['Admin', 'SuperAdmin'])],
        loadComponent: () => import('./features/admin/reports/admin-reports.component').then((m) => m.AdminReportsComponent),
      },
    ],
  },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) },
];
