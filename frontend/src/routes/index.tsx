import { createBrowserRouter, Outlet } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { CompleteProfile } from '@/pages/CompleteProfile';
import { NotFound } from '@/pages/NotFound';
import { Lobby } from '@/pages/Lobby';
import { Queue } from '@/pages/Queue';
import { Call } from '@/pages/Call';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminSessions, SessionForm } from '@/pages/admin/Sessions';
import { AdminUsers } from '@/pages/admin/Users';

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
        path: 'queue',
        element: <Queue />,
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
    path: '/call',
    element: <Call />,
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
    ],
  },
]);
