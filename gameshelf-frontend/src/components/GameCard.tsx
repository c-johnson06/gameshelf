import { Card, CardMedia, CardContent, Typography, CardActions, Button, CardActionArea, Rating, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Game } from '../types';
import { useState } from 'react';

interface GameCardProps {
  game: Game;
  onAddToShelf: (game: Game, playStatus: 'plan-to-play' | 'completed') => void;
  onUpdateGame: (gameId: number, playStatus: string, personalRating: number | null) => void;
  isInShelf: boolean;
}

const GameCard = ({ game, onAddToShelf, onUpdateGame, isInShelf }: GameCardProps) => {
  const [playStatus, setPlayStatus] = useState(game.UserGame?.playStatus || 'plan-to-play');
  const [personalRating, setPersonalRating] = useState(game.UserGame?.personalRating || null);

  const handleStatusChange = (e: any) => {
    const newStatus = e.target.value;
    setPlayStatus(newStatus);
    onUpdateGame(game.id, newStatus, personalRating);
  };

  const handleRatingChange = (newValue: number | null) => {
    setPersonalRating(newValue ? newValue * 2 : null);
    onUpdateGame(game.id, playStatus, newValue ? newValue * 2 : null);
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
      <CardActionArea component={Link} to={`/games/${game.id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="180"
          image={game.background_image || 'https://via.placeholder.com/300x180?text=No+Image'}
          alt={game.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {game.name}
          </Typography>

          {isInShelf && personalRating !== null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary" mr={0.5}>Your Rating:</Typography>
              <Rating value={personalRating / 2} precision={0.5} readOnly size="small" />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Average Rating: {game.rating}/5
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
      
      <CardActions sx={{ justifyContent: 'center', p: 2, flexDirection: 'column' }}>
        {isInShelf ? (
          <>
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={playStatus}
                label="Status"
                onChange={handleStatusChange}
                size="small"
              >
                <MenuItem value="plan-to-play">Plan to Play</MenuItem>
                <MenuItem value="playing">Playing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
                <MenuItem value="dropped">Dropped</MenuItem>
              </Select>
            </FormControl>
            <Rating
              value={personalRating ? personalRating / 2 : null}
              precision={0.5}
              onChange={(_event, newValue) => handleRatingChange(newValue)}
            />
          </>
        ) : (
          <Button size="small" variant="contained" onClick={() => onAddToShelf(game, 'plan-to-play')}>
            Add to Shelf
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default GameCard;