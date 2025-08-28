// frontend/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom'; // <-- Import RouterProvider
import './index.css';
import { router } from './routes'; // <-- Import the router object

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} /> {/* <-- Provide the router here */}
  </StrictMode>
);