import { createBrowserRouter, Navigate } from 'react-router';
import { AuthBoundary } from '@/routes/AuthBoundary';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { RootLayout } from '@/layouts/RootLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { VerifySuccessPage } from '@/pages/VerifySuccessPage';
import { VerifyFailedPage } from '@/pages/VerifyFailedPage';
import { RepositoriesPage } from '@/pages/RepositoriesPage';
import { ScanHistoryPage } from '@/pages/ScanHistoryPage';
import { IssuesPage } from '@/pages/IssuesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SonarQubeConfigPage } from '@/pages/SonarQubeConfigPage';
import { NotificationSettingsPage } from '@/pages/NotificationSettingsPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { RepositoryFormPage } from '@/pages/RepositoryFormPage';
import { RepositoryDetailPage } from '@/pages/RepositoryDetailPage';
import { ScanResultPage } from '@/pages/ScanResultPage';
import { LogViewerPage } from '@/pages/LogViewerPage';
import { PlaceholderPage } from '@/components/common/PlaceholderPage';

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
              element: <RootLayout />,
              children: [
                { path: '/dashboard', element: <DashboardPage /> },
                { path: '/repositories', element: <RepositoriesPage /> },
                { path: '/addrepository', element: <RepositoryFormPage /> },
                { path: '/settingrepo/:projectId', element: <RepositoryFormPage /> },
                { path: '/detailrepo/:projectId', element: <RepositoryDetailPage /> },
                { path: '/scanhistory', element: <ScanHistoryPage /> },
                { path: '/scanresult/:scanId', element: <ScanResultPage /> },
                { path: '/logviewer/:scanId', element: <LogViewerPage /> },
                { path: '/issue', element: <IssuesPage /> },
                { path: '/issuedetail/:issuesId', element: <PlaceholderPage title="Issue Detail" /> },
                { path: '/assignment', element: <PlaceholderPage title="Assignments" /> },
                { path: '/analysis', element: <PlaceholderPage title="Analysis" /> },
                { path: '/security-dashboard', element: <PlaceholderPage title="Security" /> },
                { path: '/technical-debt', element: <PlaceholderPage title="Technical Debt" /> },
                { path: '/generatereport', element: <PlaceholderPage title="Generate Report" /> },
                { path: '/reporthistory', element: <PlaceholderPage title="Report History" /> },
                { path: '/sonarqubeconfig', element: <SonarQubeConfigPage /> },
                { path: '/notificationsetting', element: <NotificationSettingsPage /> },
                {
                  element: <RoleRoute allowed={['ADMIN']} />,
                  children: [
                    { path: '/usermanagement', element: <UserManagementPage /> },
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
