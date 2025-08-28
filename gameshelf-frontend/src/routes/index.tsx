// frontend/src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom'; // No longer need RouterProvider here
import App from '../App';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from './ProtectedRoute';
import GamesPage from '../pages/GamesPage';

// Export the router configuration directly
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'games', element: <GamesPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile/:userId', element: <ProfilePage /> },
        ]
      }
    ],
  },
]);