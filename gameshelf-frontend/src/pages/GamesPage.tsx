import { useState } from 'react';
import { 
  Container, Typography, Box, CircularProgress, Grid, Alert, 
  TextField, Button, Chip,
  FormControl, InputLabel,
  Select, MenuItem, Slider, Paper, IconButton, Pagination
} from '@mui/material';
import { 
  Search as SearchIcon, FilterList as FilterIcon,
  Clear as ClearIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { searchGames, addUserGame, updateUserGame } from '../services/api';
import type { Game, SearchFilters } from '../types';
import GameCard from '../components/GameCard';

const POPULAR_GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Sports',
  'Racing', 'Shooter', 'Puzzle', 'Platformer', 'Fighting', 'Horror'
];

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series S/X',
  'Xbox One', 'Nintendo Switch', 'iOS', 'Android', 'Mac', 'Linux'
];

const GamesPage = () => {
  const { user, token } = useAuth();
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<SearchFilters>({
    genres: [],
    platforms: [],
    minRating: 0,
    maxRating: 5,
    releaseYear: undefined,
  });

  const handleSearch = async (event?: React.FormEvent, newPage = 1) => {
    if (event) event.preventDefault();
    
    setHasSearched(true);
    if (!query.trim()) {
      setGames([]);
      setTotalPages(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await searchGames({ query, page: newPage, page_size: 12 });

      setGames(response.data.games || []);
      
      if (response.data.pagination) {
        const { total, pageSize } = response.data.pagination;
        setPage(newPage);
        setTotalPages(Math.ceil(total / pageSize));
      } else {
        setPage(1);
        setTotalPages(0);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch games. Please try again later.');
      console.error("Detailed search error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    handleSearch(undefined, newPage);
  };

  const handleAddToShelf = async (gameToAdd: Game) => {
    if (!user || !token) {
      setError("You must be logged in to add games to your shelf.");
      return;
    }

    try {
      await addUserGame(user.id, gameToAdd, 'plan-to-play');
      setSuccessMessage(`'${gameToAdd.name}' was successfully added to your shelf!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to add '${gameToAdd.name}'.`);
      console.error(err);
    }
  };
  
  const handleUpdateGame = async (gameId: number, playStatus: string, personalRating: number | null) => {
    if (!user || !token) return;
    try {
      await updateUserGame(user.id, gameId, { playStatus, personalRating });
    } catch (err) {
      setError('Failed to update game.');
    }
  };


  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genres: [],
      platforms: [],
      minRating: 0,
      maxRating: 5,
      releaseYear: undefined,
    });
  };

  const hasActiveFilters = filters.genres!.length > 0 || 
    filters.platforms!.length > 0 || 
    filters.minRating! > 0 || 
    filters.releaseYear;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Discover Games
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Search through thousands of games and find your next favorite
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search for a game..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            size="large"
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
          <IconButton 
            onClick={() => setShowFilters(!showFilters)}
            color={hasActiveFilters ? "primary" : "default"}
            sx={{ position: 'relative' }}
          >
            <FilterIcon />
            {hasActiveFilters && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  backgroundColor: 'primary.main',
                  borderRadius: '50%'
                }}
              />
            )}
          </IconButton>
        </Box>

        {/* Filters */}
        {showFilters && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filters</Typography>
              {hasActiveFilters && (
                <Button 
                  startIcon={<ClearIcon />} 
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              )}
            </Box>
            
            <Grid container spacing={3}>
              {/* Genres */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Genres</InputLabel>
                  <Select
                    multiple
                    value={filters.genres || []}
                    onChange={(e) => handleFilterChange('genres', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {POPULAR_GENRES.map((genre) => (
                      <MenuItem key={genre} value={genre}>
                        {genre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Platforms */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Platforms</InputLabel>
                  <Select
                    multiple
                    value={filters.platforms || []}
                    onChange={(e) => handleFilterChange('platforms', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {PLATFORMS.map((platform) => (
                      <MenuItem key={platform} value={platform}>
                        {platform}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Rating */}
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Minimum Rating</Typography>
                <Slider
                  value={filters.minRating || 0}
                  onChange={(_, value) => handleFilterChange('minRating', value)}
                  min={0}
                  max={5}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              {/* Release Year */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Release Year"
                  value={filters.releaseYear || ''}
                  onChange={(e) => handleFilterChange('releaseYear', e.target.value ? parseInt(e.target.value) : undefined)}
                  inputProps={{ min: 1970, max: new Date().getFullYear() }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Active filters:
          </Typography>
          {filters.genres?.map((genre) => (
            <Chip
              key={genre}
              label={genre}
              onDelete={() => handleFilterChange('genres', filters.genres!.filter(g => g !== genre))}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
          {filters.platforms?.map((platform) => (
            <Chip
              key={platform}
              label={platform}
              onDelete={() => handleFilterChange('platforms', filters.platforms!.filter(p => p !== platform))}
              size="small"
              color="secondary"
              variant="outlined"
            />
          ))}
          {filters.minRating && filters.minRating > 0 && (
            <Chip
              label={`Min Rating: ${filters.minRating}`}
              onDelete={() => handleFilterChange('minRating', 0)}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {filters.releaseYear && (
            <Chip
              label={`Year: ${filters.releaseYear}`}
              onDelete={() => handleFilterChange('releaseYear', undefined)}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {/* Loading and Error States */}
      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ my: 2 }}>{successMessage}</Alert>}
      
      {/* Games Grid */}
      <Grid container spacing={4}>
        {games.length > 0 ? (
          games.map((game) => (
            <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
              <GameCard
                game={game}
                onAddToShelf={handleAddToShelf}
                onUpdateGame={handleUpdateGame}
                isInShelf={!!game.UserGame}
              />
            </Grid>
          ))
        ) : (
          hasSearched && !loading && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No games found
                </Typography>
                <Typography color="text.secondary">
                  Try adjusting your search terms or filters
                </Typography>
              </Paper>
            </Grid>
          )
        )}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default GamesPage;