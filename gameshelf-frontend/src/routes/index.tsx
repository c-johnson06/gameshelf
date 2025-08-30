import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';
import App from '../App';

const lazyLoad = (componentImport: Promise<{ default: React.ComponentType<any> }>) => {
  const Component = lazy(() => componentImport);
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    }>
      <Component />
    </Suspense>
  );
};

const HomePage = lazyLoad(import('../pages/HomePage'));
const LoginPage = lazyLoad(import('../pages/LoginPage'));
const RegisterPage = lazyLoad(import('../pages/RegisterPage'));
const ProfilePage = lazyLoad(import('../pages/ProfilePage'));
const GamesPage = lazyLoad(import('../pages/GamesPage'));
const GameDetailPage = lazyLoad(import('../pages/GameDetailPage'));
const ProtectedRoute = lazy(() => import('./ProtectedRoute'));
const EmailVerificationPage = lazyLoad(import('../pages/EmailVerificationPage'));
const ResendVerificationPage = lazyLoad(import('../pages/ResendVerificationPage'));


export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: HomePage },
      { path: 'login', element: LoginPage },
      { path: 'register', element: RegisterPage },
      { path: 'games', element: GamesPage },
      { path: 'games/:gameId', element: GameDetailPage },
      { path: 'profile', element: <ProtectedRoute />, children: [{ index: true, element: ProfilePage }] },
      { path: 'profile/:userId', element: ProfilePage },
      { path: 'email-verify', element: EmailVerificationPage },
      { path: 'resend-verification', element: ResendVerificationPage },
      {
        element: (
          <Suspense fallback={<CircularProgress />}>
            <ProtectedRoute />
          </Suspense>
        ),
        children: [
          { path: 'profile/:userId', element: ProfilePage },
        ]
      }
    ],
  },
]);