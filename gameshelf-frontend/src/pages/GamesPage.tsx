import { useState } from 'react';
import { Container, Typography, Box, CircularProgress, Grid, Alert, TextField, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { searchGames, addUserGame } from '../services/api';
import type { Game } from '../types';
import GameCard from '../components/GameCard';

const GamesPage = () => {
  const { user, token } = useAuth();
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setGames([]);
      
      const response = await searchGames(query);
      setGames(response.data.games);
    } catch (err) {
      setError('Failed to fetch games. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShelf = async (gameToAdd: Game) => {
    if (!user || !token) {
        setError("You must be logged in to add games to your shelf.");
        return;
    }

    try {
        await addUserGame(user.id, gameToAdd, token);
        setSuccessMessage(`'${gameToAdd.name}' was successfully added to your shelf!`);
        // clear the message after a few seconds
        setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
        setError(`Failed to add '${gameToAdd.name}'. You may already have it on your shelf.`);
        console.error(err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search for Games
        </Typography>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search for a game..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="contained" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
            Search
          </Button>
        </Box>

        {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ my: 2 }}>{successMessage}</Alert>}
        
        <Grid container spacing={4}>
          {games.map((game) => (
            <Grid key={game.id} xs={12} sm={6} md={4} lg={3}>
              <GameCard game={game} onAddToShelf={handleAddToShelf} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default GamesPage;