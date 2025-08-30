import { 
  Container, Typography, Box, Button, Grid, Card, CardContent, 
  CardMedia, Chip, Paper, CircularProgress 
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Games as GamesIcon, 
  Person as PersonIcon,
  TrendingUp as TrendingIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { searchGames } from '../services/api';
import type { Game } from '../types';

const HomePage = () => {
  const { user } = useAuth();
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedGames();
  }, []);

  const fetchFeaturedGames = async () => {
    try {
      // Get some popular games as featured games
      const response = await searchGames('popular');
      setFeaturedGames(response.data.games.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch featured games:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <SearchIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Discover Games',
      description: 'Search through thousands of games and find your next favorite',
      action: 'Browse Games',
      link: '/games'
    },
    {
      icon: <GamesIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Track Your Library',
      description: 'Keep track of games you\'ve played, are playing, or want to play',
      action: user ? 'View Library' : 'Sign Up',
      link: user ? `/profile/${user.id}` : '/register'
    },
    {
      icon: <PersonIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Write Reviews',
      description: 'Share your thoughts and rate games to help other gamers',
      action: user ? 'Start Reviewing' : 'Join Now',
      link: user ? '/games' : '/register'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          py: { xs: 8, md: 12 },
          mb: 8,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h1" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '4rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            🎮 GameShelf
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              opacity: 0.95,
              fontWeight: 300,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            Your personal gaming library and discovery platform
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/games"
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                backgroundColor: 'white',
                color: 'black',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                }
              }}
            >
              Start Exploring
            </Button>
            {!user && (
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Join GameShelf
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
            Everything You Need to Track Your Gaming
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    textAlign: 'center',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                    <Button
                      component={Link}
                      to={feature.link}
                      variant="contained"
                      fullWidth
                      sx={{ mt: 'auto' }}
                    >
                      {feature.action}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Featured Games Section */}
        <Paper sx={{ p: 4, borderRadius: 3, mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <TrendingIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h2" fontWeight={600}>
              Popular Games Right Now
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {featuredGames.map((game) => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <Card 
                    component={Link}
                    to={`/games/${game.id}`}
                    sx={{ 
                      textDecoration: 'none',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.03)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={game.background_image}
                      alt={game.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" component="div" noWrap gutterBottom>
                        {game.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Rating: {game.rating}/5
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {game.genres.slice(0, 2).map((genre) => (
                          <Chip 
                            key={genre} 
                            label={genre} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Stats Section */}
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom fontWeight={600}>
            Join the Gaming Community
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Discover new games, track your progress, and connect with fellow gamers. 
            Build your digital gaming library today.
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                10,000+
              </Typography>
              <Typography variant="body1">Games Available</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" color="secondary.main" fontWeight="bold">
                5,000+
              </Typography>
              <Typography variant="body1">User Reviews</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                1,000+
              </Typography>
              <Typography variant="body1">Active Users</Typography>
            </Grid>
          </Grid>

          {!user && (
            <Box sx={{ mt: 4 }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{ mr: 2 }}
              >
                Get Started Free
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
              >
                Sign In
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default HomePage;