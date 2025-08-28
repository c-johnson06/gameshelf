import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Typography, Box, CircularProgress, Alert, Grid, 
    Chip, Paper, Link as MuiLink, Rating, Button 
} from '@mui/material';
import { 
    Language as LanguageIcon, DeveloperMode as DeveloperModeIcon,
    Category as CategoryIcon, DateRange as DateRangeIcon, Star as StarIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { getGameDetails, updateUserGameReview, addUserGame } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';
import type { Game } from '../types';

// Interfaces for the component's state
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
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [userGameStatus, setUserGameStatus] = useState<UserGameStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Fetches all game details from the backend.
    const fetchDetails = async () => {
        if (!gameId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await getGameDetails(parseInt(gameId), token);
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

    useEffect(() => {
        fetchDetails();
    }, [gameId, token]);

    // Handles the submission of a new or updated review.
    const handleReviewSubmit = async (rating: number | null, reviewText: string) => {
        if (!user || !token || !gameId) {
            throw new Error("You must be logged in to submit a review.");
        }
        await updateUserGameReview(user.id, parseInt(gameId), token, {
            personalRating: rating,
            review: reviewText,
        });
        await fetchDetails(); // Refresh data after submission
    };

    // Adds the current game to the user's shelf.
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
            await addUserGame(user.id, gameData, token);
            await fetchDetails(); // Refresh to show the review form
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add game to shelf.");
        } finally {
            setIsAdding(false);
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
            {/* Full-width banner image with a gradient overlay */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}><DateRangeIcon color="action" sx={{ mr: 1.5 }} /><Typography><strong>Released:</strong> {details.released}</Typography></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}><DeveloperModeIcon color="action" sx={{ mr: 1.5 }} /><Typography><strong>Developers:</strong> {details.developers.join(', ')}</Typography></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}><CategoryIcon color="action" sx={{ mr: 1.5 }} /><Typography><strong>Genres:</strong> {details.genres.join(', ')}</Typography></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}><LanguageIcon color="action" sx={{ mr: 1.5 }} /><MuiLink href={details.website} target="_blank" rel="noopener">Official Website</MuiLink></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><StarIcon color="action" sx={{ mr: 1.5 }} /><Typography><strong>RAWG Rating:</strong> {details.rating} / 5</Typography></Box>
                        <Typography variant="h6" sx={{ mt: 2 }}>Platforms</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>{details.platforms.map(p => <Chip key={p} label={p} size="small" />)}</Box>
                    </Paper>
                </Grid>

                {/* Right column for description and reviews */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                        <Typography variant="h5" gutterBottom>Description</Typography>
                        <Typography paragraph sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>{details.description_raw}</Typography>
                    </Paper>

                    {/* Conditional rendering for review form or add to shelf button */}
                    {user && (
                        userGameStatus ? (
                            <ReviewForm
                                initialRating={userGameStatus.personalRating}
                                initialReview={userGameStatus.review}
                                onSubmit={handleReviewSubmit}
                            />
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddToShelf}
                                disabled={isAdding}
                                fullWidth
                                sx={{ py: 1.5, mb: 4, fontSize: '1.1rem' }}
                            >
                                {isAdding ? <CircularProgress size={24} color="inherit" /> : 'Add to Shelf to Review'}
                            </Button>
                        )
                    )}

                    {/* Community Reviews Section */}
                    <Paper sx={{ p: 3, borderRadius: 3, mt: 4 }}>
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
                            reviews.map(review => (
                                <Paper key={review.userId} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">{review.username}</Typography>
                                        {review.rating && <Rating value={review.rating / 2} precision={0.5} readOnly />}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>"{review.review}"</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{new Date(review.updatedAt).toLocaleDateString()}</Typography>
                                </Paper>
                            ))
                        ) : (
                            <Typography>No community reviews yet. Be the first!</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GameDetailPage;