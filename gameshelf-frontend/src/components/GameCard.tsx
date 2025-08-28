import { Card, CardMedia, CardContent, Typography, CardActions, Button, CardActionArea, Rating, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onAddToShelf: (game: Game) => void;
}

const GameCard = ({ game, onAddToShelf }: GameCardProps) => {
  // Determine if the user has rated this game.
  const userRating = game.UserGame?.personalRating;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
      <CardActionArea component={Link} to={`/games/${game.id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="180"
          image={game.background_image}
          alt={game.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {game.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Released: {game.released}
          </Typography>
          {/* Display user's personal rating if available */}
          {userRating !== undefined && userRating !== null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary" mr={0.5}>Your Rating:</Typography>
              <Rating value={userRating / 2} precision={0.5} readOnly size="small" />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              RAWG Rating: {game.rating}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ justifyContent: 'center', p: 2 }}>
        <Button size="small" variant="contained" onClick={() => onAddToShelf(game)}>Add to Shelf</Button>
      </CardActions>
    </Card>
  );
};

export default GameCard;