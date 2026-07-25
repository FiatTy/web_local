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
                { path: '/dashboard', element: <PlaceholderPage title="Dashboard" /> },
                { path: '/repositories', element: <RepositoriesPage /> },
                { path: '/addrepository', element: <PlaceholderPage title="Add Repository" /> },
                { path: '/settingrepo/:projectId', element: <PlaceholderPage title="Repository Settings" /> },
                { path: '/detailrepo/:projectId', element: <PlaceholderPage title="Repository Detail" /> },
                { path: '/scanhistory', element: <PlaceholderPage title="Scan History" /> },
                { path: '/scanresult/:scanId', element: <PlaceholderPage title="Scan Result" /> },
                { path: '/logviewer/:scanId', element: <PlaceholderPage title="Log Viewer" /> },
                { path: '/issue', element: <PlaceholderPage title="Issues" /> },
                { path: '/issuedetail/:issuesId', element: <PlaceholderPage title="Issue Detail" /> },
                { path: '/assignment', element: <PlaceholderPage title="Assignments" /> },
                { path: '/analysis', element: <PlaceholderPage title="Analysis" /> },
                { path: '/security-dashboard', element: <PlaceholderPage title="Security" /> },
                { path: '/technical-debt', element: <PlaceholderPage title="Technical Debt" /> },
                { path: '/generatereport', element: <PlaceholderPage title="Generate Report" /> },
                { path: '/reporthistory', element: <PlaceholderPage title="Report History" /> },
                { path: '/sonarqubeconfig', element: <PlaceholderPage title="SonarQube Config" /> },
                { path: '/notificationsetting', element: <PlaceholderPage title="Notification Settings" /> },
                {
                  element: <RoleRoute allowed={['ADMIN']} />,
                  children: [
                    { path: '/usermanagement', element: <PlaceholderPage title="User Management" /> },
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
