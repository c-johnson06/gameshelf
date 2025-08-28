import { Card, CardMedia, CardContent, Typography, CardActions, Button } from '@mui/material';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onAddToShelf: (game: Game) => void;
}

const GameCard = ({ game, onAddToShelf }: GameCardProps) => {
  return (
    <Card sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardMedia
        component="img"
        height="140"
        image={game.background_image}
        alt={game.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="div">
          {game.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Released: {game.released}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rating: {game.rating}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onAddToShelf(game)}>Add to Shelf</Button>
      </CardActions>
    </Card>
  );
};

export default GameCard;