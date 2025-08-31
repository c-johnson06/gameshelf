import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Bookmarks as BookmarksIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
  };

  const handleProfile = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
    handleCloseUserMenu();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo/Brand */}
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #fff, #e3f2fd)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.2s ease'
            }
          }}
        >
          🎮 GameShelf
        </Typography>

        {/* Navigation Links - Desktop */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to="/"
              color="inherit"
              startIcon={<HomeIcon />}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Home
            </Button>
            <Button
              component={Link}
              to="/games"
              color="inherit"
              startIcon={<SearchIcon />}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Search Games
            </Button>
            <Button
              component={Link}
              to="/users"
              color="inherit"
              startIcon={<PeopleIcon />}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Find Users
            </Button>
            <Button
              component={Link}
              to={user ? `/profile/${user.id}` : "/login"}
              color="inherit"
              startIcon={<BookmarksIcon />}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Library
            </Button>
          </Box>
        )}

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <IconButton
                onClick={handleUserMenu}
                sx={{
                  p: 0,
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Avatar
                  src={user.avatar || undefined}
                  sx={{
                    bgcolor: 'secondary.main',
                    width: 36,
                    height: 36,
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <MenuItem onClick={handleProfile} sx={{ gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  My Profile
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ gap: 1, color: 'error.main' }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                to="/login"
                color="inherit"
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  backgroundColor: 'white',
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Navigation */}
      {isMobile && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-around',
          pb: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Button
            component={Link}
            to="/"
            color="inherit"
            size="small"
            startIcon={<HomeIcon />}
          >
            Home
          </Button>
          <Button
            component={Link}
            to="/games"
            color="inherit"
            size="small"
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
          <Button
            component={Link}
            to="/users"
            color="inherit"
            size="small"
            startIcon={<PeopleIcon />}
          >
            Users
          </Button>
          <Button
            component={Link}
            to={user ? `/profile/${user.id}` : "/login"}
            color="inherit"
            size="small"
            startIcon={<BookmarksIcon />}
          >
            Library
          </Button>
        </Box>
      )}
    </AppBar>
  );
};

export default Header;