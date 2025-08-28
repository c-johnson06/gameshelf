import { Outlet } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
} from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7e57c2', // A softer purple
      light: '#b085f5',
      dark: '#4d2c91',
    },
    secondary: {
      main: '#00bfa5', // A vibrant teal
      light: '#5df2d6',
      dark: '#008e76',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, fontSize: '3.5rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.3 },
    h4: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.4 },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    body1: { fontSize: '1rem', lineHeight: 1.7 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundImage: 'none', // Important for dark mode paper
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }
        }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
     MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 30, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }
      }
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <AuthProvider>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            backgroundColor: 'background.default'
          }}
        >
          <CssBaseline />
          <Header />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1,
              width: '100%',
              py: { xs: 2, md: 4 },
            }}
          >
            {/* The Container has been removed from here to allow pages to control their own width */}
            <Outlet />
          </Box>
          <Footer />
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;