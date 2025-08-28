import { useState } from 'react';
import { Box, Typography, Rating, TextField, Button, CircularProgress, Alert, Paper } from '@mui/material';

interface ReviewFormProps {
    gameId: number;
    initialRating: number | null;
    initialReview: string | null;
    onSubmit: (rating: number | null, review: string) => Promise<void>;
}

const ReviewForm = ({ initialRating, initialReview, onSubmit }: ReviewFormProps) => {
    const [rating, setRating] = useState<number | null>(initialRating);
    const [review, setReview] = useState(initialReview || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onSubmit(rating, review);
        } catch (err: any) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 3, mt: 4 }}>
            <Typography variant="h5" gutterBottom>Your Review</Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <Typography component="legend">Your Rating</Typography>
                <Rating
                    name="personal-rating"
                    value={rating ? rating / 2 : null} // Convert 10-point to 5-star
                    precision={0.5}
                    onChange={(_event, newValue) => {
                        setRating(typeof newValue === 'number' ? newValue * 2 : null);
                    }}
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Your Review"
                    multiline
                    rows={4}
                    fullWidth
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Button type="submit" variant="contained" disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} /> : 'Submit Review'}
                </Button>
            </Box>
        </Paper>
    );
};

export default ReviewForm;