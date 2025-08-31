import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Grid, Alert,
  Paper, Avatar, Chip, Card, Tabs, Tab,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton
} from '@mui/material';
import {
  CalendarMonth, Games, Star, TrendingUp,
  Delete as DeleteIcon, Edit as EditIcon,
  PersonAdd as FollowIcon, PersonRemove as UnfollowIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getUserGames, getUserProfile, deleteUserGame, updateUserGame, followUser, unfollowUser, updateUserProfile } from '../services/api';
import type { Game, UserProfile } from '../types';
import GameCard from '../components/GameCard';


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
  const { user, token, updateUser } = useAuth(); // <-- Get updateUser from context
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
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user && userId && user.id.toString() === userId;

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
      setBio(profileResponse.data.bio || '');
      setAvatar(profileResponse.data.avatar || '');

      setGames(gamesResponse.data.map((game: any) => ({
        ...game,
        UserGame: game.UserGame,
      })));

      // Check if the current user is following this profile
      // This needs an API endpoint like `/users/{userId}/isFollowing`
      // Or include it in the getUserProfile response
      if (user && user.id.toString() !== userId) {
        setIsFollowing(profileResponse.data.isFollowing || false); // Assuming the API provides this
      }

    } catch (err) {
      setError('Failed to fetch profile data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, token]);

  useEffect(() => {
    filterGamesByTab();
  }, [games, tabValue]);

  const handleFollow = async () => {
    if (!user || !token || !userId) return;
    setFollowLoading(true);
    try {
      await followUser(parseInt(userId));
      setIsFollowing(true);
      setProfile(prev => prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : prev);
    } catch (err) {
      setError('Failed to follow user.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !token || !userId) return;
    setFollowLoading(true);
    try {
      await unfollowUser(parseInt(userId));
      setIsFollowing(false);
      setProfile(prev => prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) } : prev);
    } catch (err) {
      setError('Failed to unfollow user.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !token) return;

    try {
      const response = await updateUserProfile(user.id, { bio, avatar });
      setEditProfileDialogOpen(false);
      // Update the profile state with the returned user data
      setProfile(prev => prev ? { ...prev, ...response.data.user } : null);
      // Update the global user state in AuthContext so the header avatar updates
      if (isOwnProfile) {
        updateUser({ avatar: response.data.user.avatar });
      }
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  const filterGamesByTab = () => {
    // ... (filtering logic is correct and unchanged)
    let filtered: Game[] = [];
    switch (tabValue) {
      case 0:
        filtered = games;
        break;
      case 1:
        filtered = games.filter(g => g.UserGame?.playStatus === 'playing');
        break;
      case 2:
        filtered = games.filter(g => g.UserGame?.playStatus === 'completed');
        break;
      case 3:
        filtered = games.filter(g => g.UserGame?.playStatus === 'plan-to-play');
        break;
      case 4:
        filtered = games.filter(g => g.UserGame?.playStatus === 'on-hold');
        break;
      case 5:
        filtered = games.filter(g => g.UserGame?.playStatus === 'dropped');
        break;
    }
    setFilteredGames(filtered);
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
      await fetchProfileData();
    } catch (err) {
      setError('Failed to update game.');
    }
  };
  
  // ... (rest of the component JSX is unchanged but now uses the new state logic)
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
            src={profile.avatar || undefined}
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
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              {profile.username}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
              <Chip 
                icon={<CalendarMonth />} 
                label={`Joined ${new Date(profile.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}`}
                variant="outlined" 
              />
              <Typography variant="body2" color="text.secondary">{profile.followersCount || 0} Followers</Typography>
              <Typography variant="body2" color="text.secondary">{profile.followeesCount || 0} Following</Typography>
            </Box>
             <Typography variant="body1" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {profile.bio || 'No bio yet.'}
            </Typography>
          </Box>
          {isOwnProfile ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditProfileDialogOpen(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant={isFollowing ? 'outlined' : 'contained'}
              startIcon={isFollowing ? <UnfollowIcon /> : <FollowIcon />}
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={followLoading}
            >
              {followLoading ? <CircularProgress size={24} /> : (isFollowing ? 'Unfollow' : 'Follow')}
            </Button>
          )}
        </Box>

        {/* Statistics */}
        <Grid container spacing={2}>
          {statCards.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2, height: '100%' }}>
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
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
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
                <Typography sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                No games in this category.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                {filteredGames.map((game) => (
                    <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
                    <Box sx={{ position: 'relative' }}>
                        <GameCard
                        game={game}
                        onAddToShelf={() => {}}
                        onUpdateGame={handleUpdateGame}
                        isInShelf={true}
                        />
                        {isOwnProfile && (
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, game })}
                            sx={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.8)' }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
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
        <DialogTitle>Remove "{deleteDialog.game?.name}"</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this game from your library? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, game: null })}>Cancel</Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialogOpen} onClose={() => setEditProfileDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Avatar URL"
            type="text"
            fullWidth
            variant="outlined"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="https://example.com/your-image.png"
          />
          <TextField
            margin="dense"
            label="Bio"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about yourself..."
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;