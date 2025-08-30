import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Typography, Box, CircularProgress, Alert, Grid, 
    Chip, Paper, Link as MuiLink, Rating, Button,
    Card, CardMedia, CardContent, CardActionArea 
} from '@mui/material';
import { 
    Language as LanguageIcon, DeveloperMode as DeveloperModeIcon,
    Category as CategoryIcon, DateRange as DateRangeIcon, Star as StarIcon,
    Add as AddIcon, Recommend as RecommendIcon
} from '@mui/icons-material';
import { getGameDetails, updateUserGameReview, addUserGame, getRelatedGames, deleteUserGame } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';
import type { Game } from '../types';
import { Link } from 'react-router-dom';

interface GameDetails {
    id: number;
    name: string;
    description_raw: string;
    released: string;
    background_image: string;
    website: string;
    rating: number;
    platforms: string[];
    genres: string[];
    developers: string[];
}

interface Review {
    userId: number;
    username: string;
    rating: number | null;
    review: string;
    updatedAt: string;
}

interface UserGameStatus {
    playStatus: string;
    personalRating: number | null;
    review: string | null;
}

const GameDetailPage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [details, setDetails] = useState<GameDetails | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [relatedGames, setRelatedGames] = useState<Game[]>([]);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [userGameStatus, setUserGameStatus] = useState<UserGameStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchDetails();
        fetchRelatedGames();
    }, [gameId, token]);

    const fetchDetails = async () => {
        if (!gameId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await getGameDetails(parseInt(gameId));
            setDetails(response.data.details);
            setReviews(response.data.reviews);
            setAverageRating(response.data.averageRating);
            setUserGameStatus(response.data.userGameStatus);
        } catch (err) {
            setError('Failed to fetch game details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedGames = async () => {
        if (!gameId) return;
        try {
            setRelatedLoading(true);
            const response = await getRelatedGames(parseInt(gameId));
            setRelatedGames(response.data.games);
        } catch (err) {
            console.error('Failed to fetch related games:', err);
            // Don't show error for related games, just fail silently
        } finally {
            setRelatedLoading(false);
        }
    };

    const handleReviewSubmit = async (rating: number | null, reviewText: string) => {
        if (!user || !token || !gameId) {
            throw new Error("You must be logged in to submit a review.");
        }
        await updateUserGameReview(user.id, parseInt(gameId),{
            personalRating: rating,
            review: reviewText,
        });
        await fetchDetails();
    };

    const handleDeleteReview = async () => {
        if (!user || !token || !gameId) {
            throw new Error("You must be logged in to delete a review.");
        }
        
        // Use the review deletion endpoint
        await fetch(`/api/users/${user.id}/games/${gameId}/review`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        await fetchDetails();
    };

    const handleAddToShelf = async () => {
        if (!user || !token) {
            navigate('/login');
            return;
        }
        if (!details) return;

        setIsAdding(true);
        try {
            const gameData: Game = {
                id: details.id,
                name: details.name,
                released: details.released,
                background_image: details.background_image,
                rating: details.rating,
                platforms: details.platforms,
                genres: details.genres,
            };
            await addUserGame(user.id, gameData, 'plan-to-play');
            await fetchDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add game to shelf.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveFromShelf = async () => {
        if (!user || !token || !gameId) return;
        
        try {
            await deleteUserGame(user.id, parseInt(gameId));
            await fetchDetails();
        } catch (err: any) {
            setError("Failed to remove game from shelf.");
        }
    };

    if (loading) {
        return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 8 }} size={60} />;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    }

    if (!details) {
        return <Typography sx={{textAlign: 'center', mt: 4}}>Game not found.</Typography>;
    }

    return (
        <Box>
            {/* Full-width banner image with gradient overlay */}
            <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', mb: 4 }}>
                <Box
                    sx={{
                        height: { xs: 300, md: 500 },
                        position: 'relative',
                        background: `url(${details.background_image}) center center / cover no-repeat`,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(to top, rgba(18,18,18,1) 0%, rgba(18,18,18,0) 60%)',
                        }
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0, left: 0, right: 0,
                            p: { xs: 2, md: 4 },
                            color: 'white',
                        }}
                    >
                        <Typography variant="h1" component="h1" sx={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                            {details.name}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={4}>
                {/* Left column for game details */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: '88px' }}>
                        <Typography variant="h5" gutterBottom>Details</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <DateRangeIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography><strong>Released:</strong> {details.released}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <DeveloperModeIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography><strong>Developers:</strong> {details.developers.join(', ')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <CategoryIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography><strong>Genres:</strong> {details.genres.join(', ')}</Typography>
                        </Box>
                        {details.website && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <LanguageIcon color="action" sx={{ mr: 1.5 }} />
                                <MuiLink href={details.website} target="_blank" rel="noopener">
                                    Official Website
                                </MuiLink>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <StarIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography><strong>RAWG Rating:</strong> {details.rating} / 5</Typography>
                        </Box>
                        
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Platforms</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {details.platforms.map(p => <Chip key={p} label={p} size="small" />)}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right column for description and reviews */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                        <Typography variant="h5" gutterBottom>Description</Typography>
                        <Typography paragraph sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                            {details.description_raw}
                        </Typography>
                    </Paper>

                    {/* User Review Section */}
                    {user && (
                        userGameStatus ? (
                            <Box sx={{ mb: 4 }}>
                                <ReviewForm
                                    initialRating={userGameStatus.personalRating}
                                    initialReview={userGameStatus.review}
                                    onSubmit={handleReviewSubmit}
                                    onDelete={handleDeleteReview}
                                    showDelete={true}
                                />
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleRemoveFromShelf}
                                    sx={{ mt: 2 }}
                                    size="small"
                                >
                                    Remove from Library
                                </Button>
                            </Box>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddToShelf}
                                disabled={isAdding}
                                fullWidth
                                sx={{ py: 1.5, mb: 4, fontSize: '1.1rem' }}
                            >
                                {isAdding ? <CircularProgress size={24} color="inherit" /> : 'Add to Library to Review'}
                            </Button>
                        )
                    )}

                    {/* Related Games Section */}
                    {relatedGames.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <RecommendIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h5">You Might Also Like</Typography>
                            </Box>
                            
                            {relatedLoading ? (
                                <CircularProgress sx={{ display: 'block', margin: 'auto' }} />
                            ) : (
                                <Grid container spacing={2}>
                                    {relatedGames.slice(0, 6).map((game) => (
                                        <Grid item xs={6} md={4} key={game.id}>
                                            <Card 
                                                sx={{ 
                                                    height: '100%',
                                                    transition: 'transform 0.2s',
                                                    '&:hover': { transform: 'scale(1.02)' }
                                                }}
                                            >
                                                <CardActionArea 
                                                    component={Link} 
                                                    to={`/games/${game.id}`}
                                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                                >
                                                    <CardMedia
                                                        component="img"
                                                        height="120"
                                                        image={game.background_image}
                                                        alt={game.name}
                                                        sx={{ objectFit: 'cover' }}
                                                    />
                                                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                                                        <Typography 
                                                            variant="subtitle2" 
                                                            component="div" 
                                                            noWrap
                                                            sx={{ fontWeight: 600 }}
                                                        >
                                                            {game.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Rating: {game.rating}/5
                                                        </Typography>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>
                    )}

                    {/* Community Reviews Section */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Community Reviews</Typography>
                            {averageRating !== null && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6">{averageRating.toFixed(1)} / 10</Typography>
                                    <Rating value={averageRating / 2} precision={0.1} readOnly />
                                </Box>
                            )}
                        </Box>
                        
                        {reviews.length > 0 ? (
                            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                                {reviews.map(review => (
                                    <Paper 
                                        key={review.userId} 
                                        variant="outlined" 
                                        sx={{ p: 2, mb: 2, borderRadius: 2 }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            mb: 1 
                                        }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {review.username}
                                            </Typography>
                                            {review.rating && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Rating value={review.rating / 2} precision={0.5} readOnly size="small" />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {review.rating}/10
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        {review.review && (
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontStyle: 'italic', 
                                                    color: 'text.secondary',
                                                    mb: 1,
                                                    lineHeight: 1.6
                                                }}
                                            >
                                                "{review.review}"
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(review.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        ) : (
                            <Typography color="text.secondary">
                                No community reviews yet. Be the first to share your thoughts!
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GameDetailPage;