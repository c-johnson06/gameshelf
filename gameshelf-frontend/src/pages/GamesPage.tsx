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
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasSearched(true);
    if (!query) {
        setGames([]);
        return;
    };

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
        await addUserGame(user.id, gameToAdd, token, 'plan-to-play');
        setSuccessMessage(`'${gameToAdd.name}' was successfully added to your shelf!`);
        setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
        setError(err.response?.data?.message || `Failed to add '${gameToAdd.name}'.`);
        console.error(err);
    }
  };

  return (
    <Container maxWidth="xl">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h2" component="h1" gutterBottom>
            Search for Games
            </Typography>
            <Typography variant="h5" color="text.secondary">
            Discover your next adventure.
            </Typography>
        </Box>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', mb: 4, maxWidth: '700px', mx: 'auto' }}>
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
        {error && <Alert severity="error" sx={{ my: 2, maxWidth: '700px', mx: 'auto' }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ my: 2, maxWidth: '700px', mx: 'auto' }}>{successMessage}</Alert>}
        
        <Grid container spacing={4}>
            {games.length > 0 ? (
                games.map((game) => (
                    <Grid item key={game.id} xs={12} sm={6} md={4}>
                        <GameCard
                            game={game}
                            onAddToShelf={handleAddToShelf}
                            onUpdateGame={() => {}}
                            isInShelf={false}
                        />
                    </Grid>
                ))
            ) : (
                hasSearched && !loading && (
                    <Grid item xs={12}>
                        <Typography sx={{textAlign: 'center', mt: 4}}>No games found for your search.</Typography>
                    </Grid>
                )
            )}
        </Grid>
    </Container>
  );
};

export default GamesPage;