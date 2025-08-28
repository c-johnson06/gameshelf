// frontend/src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Grid, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getUserGames } from '../services/api';
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
        const formattedGames = response.data.map((game: any) => ({
          ...game,
          background_image: game.backgroundImage,
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

  const handleAddToShelf = (game: Game) => {
    console.log('Adding to shelf (from profile):', game.name);
  };
  
  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.username}'s Shelf
        </Typography>
        
        {games.length === 0 ? (
          <Typography>No games on your shelf yet. Go search for some!</Typography>
        ) : (
          <Grid container spacing={4}>
            {games.map((game) => (
              <Grid key={game.id} xs={12} sm={6} md={4} lg={3}>
                <GameCard game={game} onAddToShelf={handleAddToShelf} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default ProfilePage;