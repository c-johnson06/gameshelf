import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Grid, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getUserGames, addUserGame, updateUserGame } from '../services/api';
import type { Game } from '../types';
import GameCard from '../components/GameCard';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      if (!userId || !token) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getUserGames(parseInt(userId), token);
        // The backend now returns the full game object including UserGame details
        const formattedGames = response.data.map((game: any) => ({
          ...game,
          background_image: game.backgroundImage,
          // The through object contains the UserGame data
          UserGame: game.UserGame, 
        }));
        setGames(formattedGames);
      } catch (err) {
        setError('Failed to fetch user games.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [userId, token]);

  // This function is a placeholder on this page but required by GameCard
  const handleAddToShelf = async (game: Game) => {
    if (!user || !token) return;
    try {
      await addUserGame(user.id, game, token, 'plan-to-play');
      // Optionally, you could add a success message here
    } catch (err) {
      // Optionally, handle error message
      console.error("Failed to add game", err);
    }
  };

  const handleUpdateGame = async (gameId: number, playStatus: string, personalRating: number | null) => {
    if (!user || !token) return;
    try {
      await updateUserGame(user.id, gameId, token, { playStatus, personalRating });
      // Optionally, refresh games from backend to get updated UserGame info
      const response = await getUserGames(parseInt(userId!), token);
      const formattedGames = response.data.map((game: any) => ({
        ...game,
        background_image: game.backgroundImage,
        UserGame: game.UserGame,
      }));
      setGames(formattedGames);
    } catch (err) {
      setError('Failed to update game status/rating.');
      console.error(err);
    }
  };
  
  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {user?.username}'s Shelf
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Your personal game collection.
        </Typography>
      </Box>
      
      {games.length === 0 ? (
        <Typography sx={{textAlign: 'center'}}>No games on your shelf yet. Go search for some!</Typography>
      ) : (
        <Grid container spacing={4}>
          {games.map((game) => (
            <Grid item key={game.id} xs={12} sm={6} md={4}>
              <GameCard
                game={game}
                onAddToShelf={handleAddToShelf}
                onUpdateGame={handleUpdateGame}
                isInShelf={true}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ProfilePage;
