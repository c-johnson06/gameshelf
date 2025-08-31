import { useState } from 'react';
import {
  Container, Typography, Box, CircularProgress, Grid, Alert,
  TextField, Button, Card, CardContent, Avatar, Link as MuiLink
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { searchUsers } from '../services/api';
import { Link } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  avatar: string;
  bio: string;
}

const UserSearchPage = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasSearched(true);
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await searchUsers(query);
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to search for users. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Find Gamers
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Search for other users by username
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search for a user..."
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
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {users.length > 0 ? (
          users.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, height: '100%' }}>
                <Avatar sx={{ width: 64, height: 64, mb: 2, bgcolor: 'primary.main' }} src={user.avatar}>
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="h6" component="div" noWrap>
                    {user.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.bio || 'No bio provided'}
                  </Typography>
                </CardContent>
                <Button component={Link} to={`/profile/${user.id}`} size="small" variant="outlined" startIcon={<PersonIcon />}>
                  View Profile
                </Button>
              </Card>
            </Grid>
          ))
        ) : (
          hasSearched && !loading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            </Grid>
          )
        )}
      </Grid>
    </Container>
  );
};

export default UserSearchPage;