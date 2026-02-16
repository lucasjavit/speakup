import { createBrowserRouter, Outlet } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedCallRoute } from '@/components/guards';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { CompleteProfile } from '@/pages/CompleteProfile';
import { NotFound } from '@/pages/NotFound';
import { Lobby } from '@/pages/Lobby';
import { Call } from '@/pages/Call';
import { Break } from '@/pages/Break';
import { Credits } from '@/pages/Credits';
import { BuyCredits } from '@/pages/BuyCredits';
import { PaymentSuccess } from '@/pages/PaymentSuccess';
import { Conversations, TranscriptDetails } from '@/pages/Conversations';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminSessions, SessionForm } from '@/pages/admin/Sessions';
import { AdminUsers } from '@/pages/admin/Users';
import { AdminPayments } from '@/pages/admin/Payments';
import { AdminFeedbacks } from '@/pages/admin/Feedbacks';
import { AdminSettings } from '@/pages/admin/Settings';
import { Feedback } from '@/pages/Feedback';
import { Settings } from '@/pages/Settings';
import { Error } from '@/pages/Error';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <MainLayout>
        <Outlet />
      </MainLayout>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'lobby',
        element: <Lobby />,
      },
      {
        path: 'conversations',
        element: <Conversations />,
      },
      {
        path: 'conversations/:id',
        element: <TranscriptDetails />,
      },
      {
        path: 'credits',
        element: <Credits />,
      },
      {
        path: 'credits/buy',
        element: <BuyCredits />,
      },
      {
        path: 'credits/success',
        element: <PaymentSuccess />,
      },
      {
        path: 'break',
        element: <Break />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'feedback',
        element: <Feedback />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/error',
    element: <Error />,
  },
  {
    path: '/call',
    element: (
      <ProtectedCallRoute>
        <Call />
      </ProtectedCallRoute>
    ),
  },
  {
    path: '/complete-profile',
    element: <CompleteProfile />,
  },
  {
    path: '/admin',
    element: (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'sessions',
        element: <AdminSessions />,
      },
      {
        path: 'sessions/new',
        element: <SessionForm />,
      },
      {
        path: 'sessions/:id/edit',
        element: <SessionForm />,
      },
      {
        path: 'users',
        element: <AdminUsers />,
      },
      {
        path: 'payments',
        element: <AdminPayments />,
      },
      {
        path: 'feedbacks',
        element: <AdminFeedbacks />,
      },
      {
        path: 'settings',
        element: <AdminSettings />,
      },
    ],
  },
]);
