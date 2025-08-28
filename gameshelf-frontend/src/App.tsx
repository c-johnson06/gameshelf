// frontend/src/App.tsx
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext'; // <-- Import AuthProvider
import './App.css';

function App() {
  return (
    // Wrap the entire app layout with AuthProvider
    <AuthProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CssBaseline />
        <Header />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </AuthProvider>
  );
}

export default App;