import { useState } from 'react';
import { Box, Typography, Rating, TextField, Button, CircularProgress, Alert, Paper } from '@mui/material';

interface ReviewFormProps {
    initialRating: number | null;
    initialReview: string | null;
    onSubmit: (rating: number | null, review: string) => Promise<void>;
}

const ReviewForm = ({ initialRating, initialReview, onSubmit }: ReviewFormProps) => {
    // State for the rating, review text, loading status, and errors.
    const [rating, setRating] = useState<number | null>(initialRating);
    const [review, setReview] = useState(initialReview || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Handles the form submission.
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await onSubmit(rating, review);
            setSuccess("Your review has been saved successfully!");
        } catch (err: any) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom>Your Review</Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <Typography component="legend">Your Rating</Typography>
                <Rating
                    name="personal-rating"
                    value={rating ? rating / 2 : null} // Convert 10-point scale to 5-star
                    precision={0.5}
                    onChange={(_event, newValue) => {
                        setRating(newValue ? newValue * 2 : null); // Convert back to 10-point scale
                    }}
                    sx={{ mb: 2, fontSize: '2rem' }}
                />
                <TextField
                    label="Write your review"
                    multiline
                    rows={4}
                    fullWidth
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <Button type="submit" variant="contained" disabled={isLoading} sx={{ minWidth: '150px' }}>
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Review'}
                </Button>
            </Box>
        </Paper>
    );
};

export default ReviewForm;