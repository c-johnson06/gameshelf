import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, Typography, Box, CircularProgress, Grid, Alert, 
  Paper, Avatar, Chip, Card, Tabs, Tab,
  Button, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  CalendarMonth, Games, Star, TrendingUp, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getUserGames, getUserProfile, deleteUserGame, updateUserGame } from '../services/api';
import type { Game } from '../types';
import GameCard from '../components/GameCard';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  totalGames: number;
  averageRating: number;
  completedGames: number;
  currentlyPlaying: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; game: Game | null }>({ 
    open: false, 
    game: null 
  });

  const isOwnProfile = user && userId && user.id.toString() === userId;

  useEffect(() => {
    fetchProfileData();
  }, [userId, token]);

  useEffect(() => {
    filterGamesByTab();
  }, [games, tabValue]);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const [profileResponse, gamesResponse] = await Promise.all([
        getUserProfile(parseInt(userId)),
        getUserGames(parseInt(userId))
      ]);

      setProfile(profileResponse.data);
      
      const formattedGames = gamesResponse.data.map((game: any) => ({
        ...game,
        background_image: game.backgroundImage,
        UserGame: game.UserGame,
      }));
      setGames(formattedGames);
    } catch (err) {
      setError('Failed to fetch profile data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterGamesByTab = () => {
    switch (tabValue) {
      case 0: // All
        setFilteredGames(games);
        break;
      case 1: // Currently Playing
        setFilteredGames(games.filter(g => g.UserGame?.playStatus === 'playing'));
        break;
      case 2: // Completed
        setFilteredGames(games.filter(g => g.UserGame?.playStatus === 'completed'));
        break;
      case 3: // Plan to Play
        setFilteredGames(games.filter(g => g.UserGame?.playStatus === 'plan-to-play'));
        break;
      case 4: // On Hold
        setFilteredGames(games.filter(g => g.UserGame?.playStatus === 'on-hold'));
        break;
      case 5: // Dropped
        setFilteredGames(games.filter(g => g.UserGame?.playStatus === 'dropped'));
        break;
    }
  };

  const handleDeleteGame = async () => {
    if (!deleteDialog.game || !user || !token) return;

    try {
      await deleteUserGame(user.id, deleteDialog.game.id);
      setGames(games.filter(g => g.id !== deleteDialog.game!.id));
      setDeleteDialog({ open: false, game: null });
    } catch (err) {
      setError('Failed to remove game from library.');
    }
  };

  const handleUpdateGame = async (gameId: number, playStatus: string, personalRating: number | null) => {
    if (!user || !token) return;
    
    try {
      await updateUserGame(user.id, gameId, { playStatus, personalRating });
      await fetchProfileData(); // Refresh data
    } catch (err) {
      setError('Failed to update game.');
    }
  };

  const handleAddToShelf = () => {
    // Not applicable for profile page
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  if (!profile) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Profile not found.</Typography>;
  }

  const statCards = [
    { icon: <Games />, label: 'Total Games', value: profile.totalGames, color: 'primary.main' },
    { icon: <Star />, label: 'Avg. Rating', value: profile.averageRating?.toFixed(1) || 'N/A', color: 'warning.main' },
    { icon: <TrendingUp />, label: 'Completed', value: profile.completedGames, color: 'success.main' },
    { icon: <Games />, label: 'Playing', value: profile.currentlyPlaying, color: 'info.main' },
  ];

  return (
    <Container maxWidth="xl">
      {/* Profile Header */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{ 
              width: 80, 
              height: 80, 
              mr: 3, 
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              {profile.username}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CalendarMonth />} 
                label={`Joined ${new Date(profile.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}`}
                variant="outlined" 
              />
              {isOwnProfile && (
                <Chip 
                  label={profile.email} 
                  variant="outlined" 
                  color="secondary"
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Statistics */}
        <Grid container spacing={2}>
          {statCards.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Games Library */}
      <Paper sx={{ borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${games.length})`} />
            <Tab label={`Playing (${games.filter(g => g.UserGame?.playStatus === 'playing').length})`} />
            <Tab label={`Completed (${games.filter(g => g.UserGame?.playStatus === 'completed').length})`} />
            <Tab label={`Plan to Play (${games.filter(g => g.UserGame?.playStatus === 'plan-to-play').length})`} />
            <Tab label={`On Hold (${games.filter(g => g.UserGame?.playStatus === 'on-hold').length})`} />
            <Tab label={`Dropped (${games.filter(g => g.UserGame?.playStatus === 'dropped').length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={tabValue}>
          {filteredGames.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4 }}>
              No games in this category.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filteredGames.map((game) => (
                <Grid item key={game.id} xs={12} sm={6} md={4}>
                  <Box sx={{ position: 'relative' }}>
                    <GameCard
                      game={game}
                      onAddToShelf={handleAddToShelf}
                      onUpdateGame={handleUpdateGame}
                      isInShelf={true}
                    />
                    {isOwnProfile && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialog({ open: true, game })}
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          minWidth: 'auto',
                          p: 1,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          '&:hover': { bgcolor: 'rgba(244,67,54,0.8)' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, game: null })}>
        <DialogTitle>Remove Game</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{deleteDialog.game?.name}" from your library? 
            This will also delete your review and rating.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, game: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;