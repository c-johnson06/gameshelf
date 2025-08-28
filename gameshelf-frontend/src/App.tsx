import { Outlet } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  Container,
} from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// A professional, modern dark theme for the application.
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // A lighter, more modern blue
    },
    secondary: {
      main: '#f48fb1', // A soft pink for accents
    },
    background: {
      default: '#121212', // Standard dark background
      paper: '#1e1e1e',   // Slightly lighter paper background for cards
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '3rem', letterSpacing: '-0.015em' },
    h2: { fontWeight: 700, fontSize: '2.25rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
  },
  shape: {
    borderRadius: 12, // Consistent border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 20px',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
           '&:hover': {
             transform: 'translateY(-2px)',
             boxShadow: `0 4px 20px 0 rgba(0,0,0,0.1)`,
           }
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundImage: 'none', // Disable gradient backgrounds on paper
            }
        }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          },
        },
      },
    },
     MuiAppBar: {
      styleOverrides: {
        root: {
          // Semi-transparent app bar for a modern look
          background: 'rgba(18, 18, 18, 0.8)',
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
          {/* Main content area that grows to push footer down */}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1,
              width: '100%',
            }}
          >
            {/* Container provides consistent padding and max-width for all pages */}
            <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
              <Outlet />
            </Container>
          </Box>
          <Footer />
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

