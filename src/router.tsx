import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AuthBoundary } from '@/routes/AuthBoundary';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { RootLayout } from '@/layouts/RootLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';

const RealtimeBoundary = lazy(() =>
  import('@/routes/RealtimeBoundary').then((module) => ({
    default: module.RealtimeBoundary,
  })),
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import('@/pages/VerifyEmailPage').then((module) => ({
    default: module.VerifyEmailPage,
  })),
);
const VerifySuccessPage = lazy(() =>
  import('@/pages/VerifySuccessPage').then((module) => ({
    default: module.VerifySuccessPage,
  })),
);
const VerifyFailedPage = lazy(() =>
  import('@/pages/VerifyFailedPage').then((module) => ({
    default: module.VerifyFailedPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const RepositoriesPage = lazy(() =>
  import('@/pages/RepositoriesPage').then((module) => ({
    default: module.RepositoriesPage,
  })),
);
const RepositoryFormPage = lazy(() =>
  import('@/pages/RepositoryFormPage').then((module) => ({
    default: module.RepositoryFormPage,
  })),
);
const RepositoryDetailPage = lazy(() =>
  import('@/pages/RepositoryDetailPage').then((module) => ({
    default: module.RepositoryDetailPage,
  })),
);
const ScanHistoryPage = lazy(() =>
  import('@/pages/ScanHistoryPage').then((module) => ({
    default: module.ScanHistoryPage,
  })),
);
const ScanResultPage = lazy(() =>
  import('@/pages/ScanResultPage').then((module) => ({
    default: module.ScanResultPage,
  })),
);
const LogViewerPage = lazy(() =>
  import('@/pages/LogViewerPage').then((module) => ({
    default: module.LogViewerPage,
  })),
);
const IssuesPage = lazy(() =>
  import('@/pages/IssuesPage').then((module) => ({
    default: module.IssuesPage,
  })),
);
const IssueDetailPage = lazy(() =>
  import('@/pages/IssueDetailPage').then((module) => ({
    default: module.IssueDetailPage,
  })),
);
const AssignmentsPage = lazy(() =>
  import('@/pages/AssignmentsPage').then((module) => ({
    default: module.AssignmentsPage,
  })),
);
const AnalysisPage = lazy(() =>
  import('@/pages/AnalysisPage').then((module) => ({
    default: module.AnalysisPage,
  })),
);
const SecurityDashboardPage = lazy(() =>
  import('@/pages/SecurityDashboardPage').then((module) => ({
    default: module.SecurityDashboardPage,
  })),
);
const TechnicalDebtPage = lazy(() =>
  import('@/pages/TechnicalDebtPage').then((module) => ({
    default: module.TechnicalDebtPage,
  })),
);
const GenerateReportPage = lazy(() =>
  import('@/pages/GenerateReportPage').then((module) => ({
    default: module.GenerateReportPage,
  })),
);
const ReportHistoryPage = lazy(() =>
  import('@/pages/ReportHistoryPage').then((module) => ({
    default: module.ReportHistoryPage,
  })),
);
const SonarQubeConfigPage = lazy(() =>
  import('@/pages/SonarQubeConfigPage').then((module) => ({
    default: module.SonarQubeConfigPage,
  })),
);
const NotificationSettingsPage = lazy(() =>
  import('@/pages/NotificationSettingsPage').then((module) => ({
    default: module.NotificationSettingsPage,
  })),
);
const ComponentsPage = lazy(() =>
  import('@/pages/ComponentsPage').then((module) => ({
    default: module.ComponentsPage,
  })),
);
const UserManagementPage = lazy(() =>
  import('@/pages/UserManagementPage').then((module) => ({
    default: module.UserManagementPage,
  })),
);

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
      element: <AuthBoundary />,
      children: [
        { path: '/', element: <LandingPage /> },
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
        { path: '/reset-password', element: <ResetPasswordPage /> },
        { path: '/forgot-password', element: <ForgotPasswordPage /> },
        { path: '/verify-email', element: <VerifyEmailPage /> },
        { path: '/verify-success', element: <VerifySuccessPage /> },
        { path: '/verify-failed', element: <VerifyFailedPage /> },
        {
          element: <ProtectedRoute />,
          children: [
            {
              element: <RealtimeBoundary />,
              children: [
                {
                  element: <RootLayout />,
                  children: [
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/repositories', element: <RepositoriesPage /> },
                    { path: '/addrepository', element: <RepositoryFormPage /> },
                    {
                      path: '/settingrepo/:projectId',
                      element: <RepositoryFormPage />,
                    },
                    {
                      path: '/detailrepo/:projectId',
                      element: <RepositoryDetailPage />,
                    },
                    { path: '/scanhistory', element: <ScanHistoryPage /> },
                    {
                      path: '/scanresult/:scanId',
                      element: <ScanResultPage />,
                    },
                    { path: '/logviewer/:scanId', element: <LogViewerPage /> },
                    { path: '/issue', element: <IssuesPage /> },
                    {
                      path: '/issuedetail/:issuesId',
                      element: <IssueDetailPage />,
                    },
                    { path: '/assignment', element: <AssignmentsPage /> },
                    { path: '/analysis', element: <AnalysisPage /> },
                    {
                      path: '/security-dashboard',
                      element: <SecurityDashboardPage />,
                    },
                    { path: '/technical-debt', element: <TechnicalDebtPage /> },
                    {
                      path: '/generatereport',
                      element: <GenerateReportPage />,
                    },
                    { path: '/reporthistory', element: <ReportHistoryPage /> },
                    {
                      path: '/sonarqubeconfig',
                      element: <SonarQubeConfigPage />,
                    },
                    {
                      path: '/notificationsetting',
                      element: <NotificationSettingsPage />,
                    },
                    { path: '/components', element: <ComponentsPage /> },
                    {
                      element: <RoleRoute allowed={['ADMIN']} />,
                      children: [
                        {
                          path: '/usermanagement',
                          element: <UserManagementPage />,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename },
);
