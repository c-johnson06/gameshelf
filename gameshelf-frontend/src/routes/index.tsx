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

const EmailVerificationPage = () => (
  <Box sx={{ textAlign: 'center', mt: 8 }}>
    <h2>Email Verification</h2>
    <p>This feature is not yet implemented in the demo version.</p>
  </Box>
);

const ResendVerificationPage = () => (
  <Box sx={{ textAlign: 'center', mt: 8 }}>
    <h2>Resend Verification</h2>
    <p>This feature is not yet implemented in the demo version.</p>
  </Box>
);

const HomePage = lazyLoad(import('../pages/HomePage'));
const LoginPage = lazyLoad(import('../pages/LoginPage'));
const RegisterPage = lazyLoad(import('../pages/RegisterPage'));
const ProfilePage = lazyLoad(import('../pages/ProfilePage'));
const GamesPage = lazyLoad(import('../pages/GamesPage'));
const GameDetailPage = lazyLoad(import('../pages/GameDetailPage'));
const ProtectedRoute = lazy(() => import('./ProtectedRoute'));

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
      { 
        path: 'profile/:userId', 
        element: (
          <Suspense fallback={<CircularProgress />}>
            <ProtectedRoute />
          </Suspense>
        ),
        children: [
          { index: true, element: ProfilePage }
        ]
      },
      { path: 'email-verify', element: <EmailVerificationPage /> },
      { path: 'resend-verification', element: <ResendVerificationPage /> },
    ],
  },
]);