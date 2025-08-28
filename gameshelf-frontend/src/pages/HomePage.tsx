import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Grid,
  Card,
  CardContent,
  Fade,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search as SearchIcon,
  LibraryBooks as LibraryIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <SearchIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Discover Games',
      description: 'Search through thousands of games and find your next favorite',
      action: 'Start Exploring',
      link: '/games'
    },
    {
      icon: <LibraryIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Track Your Progress',
      description: 'Keep track of games you\'re playing, completed, or planning to play',
      action: user ? 'View My Library' : 'Sign Up Now',
      link: user ? `/profile/${user.id}` : '/register'
    },
    {
      icon: <StarIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
      title: 'Rate & Review',
      description: 'Share your thoughts and see what the community thinks',
      action: 'Get Started',
      link: user ? '/games' : '/register'
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          color: 'white',
          py: { xs: 6, md: 10 },
          px: 4,
          mb: 6,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  fontWeight: 800,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(45deg, #fff, #e3f2fd)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Welcome to GameShelf
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  maxWidth: '600px',
                  mx: 'auto',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.6
                }}
              >
                Your personal gaming library. Discover, track, and organize your favorite games all in one place.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {!user ? (
                  <>
                    <Button
                      component={Link}
                      to="/register"
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      component={Link}
                      to="/games"
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Browse Games
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      component={Link}
                      to={`/profile/${user.id}`}
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem'
                      }}
                    >
                      View My Library
                    </Button>
                    <Button
                      component={Link}
                      to="/games"
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem'
                      }}
                    >
                      Discover Games
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          component="h2"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: 'text.primary',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 4,
              backgroundColor: 'primary.main',
              borderRadius: 2
            }
          }}
        >
          Why Choose GameShelf?
        </Typography>

        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Fade in timeout={800 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'center',
                    p: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 3 }}>{feature.icon}</Box>
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.7 }}
                    >
                      {feature.description}
                    </Typography>
                    <Button
                      component={Link}
                      to={feature.link}
                      variant="contained"
                      sx={{
                        mt: 'auto',
                        borderRadius: 25,
                        px: 3
                      }}
                    >
                      {feature.action}
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Stats Section */}
        <Box
          sx={{
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            borderRadius: 4,
            p: 6,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            Join Thousands of Gamers
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  10K+
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Games in Database
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700 }}>
                  1K+
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Active Users
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 700 }}>
                  50K+
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Games Tracked
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;