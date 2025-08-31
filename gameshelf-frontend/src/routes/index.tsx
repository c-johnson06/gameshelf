import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from './ProtectedRoute';
import GamesPage from '../pages/GamesPage';
import GameDetailPage from '../pages/GameDetailPage';
import UserSearchPage from '../pages/UserSearchPage'; // <-- Import the new page

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'games', element: <GamesPage /> },
      { path: 'games/:gameId', element: <GameDetailPage /> },
      { path: 'users', element: <UserSearchPage /> }, // <-- Add the new route here
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile/:userId', element: <ProfilePage /> },
        ]
      }
    ],
  },
]);