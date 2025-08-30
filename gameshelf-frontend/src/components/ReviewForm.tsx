import { useState } from 'react';
import { 
  Box, Typography, Rating, TextField, Button, CircularProgress, 
  Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';

interface ReviewFormProps {
    initialRating: number | null;
    initialReview: string | null;
    onSubmit: (rating: number | null, review: string) => Promise<void>;
    onDelete?: () => Promise<void>;
    showDelete?: boolean;
}

const ReviewForm = ({ 
  initialRating, 
  initialReview, 
  onSubmit, 
  onDelete, 
  showDelete = false 
}: ReviewFormProps) => {
    const [rating, setRating] = useState<number | null>(initialRating);
    const [review, setReview] = useState(initialReview || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(!initialReview && !initialRating);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasContent = initialRating || initialReview;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            await onSubmit(rating, review);
            setSuccess("Your review has been saved successfully!");
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        
        setIsDeleting(true);
        try {
            await onDelete();
            setSuccess("Your review has been deleted.");
            setDeleteDialog(false);
            
            // Reset form
            setRating(null);
            setReview('');
            setIsEditing(true);
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete review.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        setRating(initialRating);
        setReview(initialReview || '');
        setIsEditing(false);
        setError(null);
    };

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Your Review</Typography>
                
                {hasContent && !isEditing && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => setIsEditing(true)}
                            variant="outlined"
                        >
                            Edit
                        </Button>
                        {showDelete && onDelete && (
                            <Button
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => setDeleteDialog(true)}
                                variant="outlined"
                                color="error"
                            >
                                Delete
                            </Button>
                        )}
                    </Box>
                )}
            </Box>

            {isEditing ? (
                <Box component="form" onSubmit={handleSubmit}>
                    <Typography component="legend" sx={{ mb: 1 }}>Your Rating</Typography>
                    <Rating
                        name="personal-rating"
                        value={rating ? rating / 2 : null}
                        precision={0.5}
                        onChange={(_event, newValue) => {
                            setRating(newValue ? newValue * 2 : null);
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
                        placeholder="Share your thoughts about this game..."
                    />
                    
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={isLoading}
                            startIcon={<SaveIcon />}
                            sx={{ minWidth: '120px' }}
                        >
                            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Review'}
                        </Button>
                        
                        {hasContent && (
                            <Button 
                                variant="outlined" 
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        )}
                    </Box>
                </Box>
            ) : (
                <Box>
                    {rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body1" sx={{ mr: 1 }}>Your Rating:</Typography>
                            <Rating value={rating / 2} precision={0.5} readOnly />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({rating}/10)
                            </Typography>
                        </Box>
                    )}
                    
                    {review && (
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Your Review:
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontStyle: 'italic', 
                                    p: 2, 
                                    backgroundColor: 'action.hover', 
                                    borderRadius: 1,
                                    borderLeft: 3,
                                    borderColor: 'primary.main'
                                }}
                            >
                                "{review}"
                            </Typography>
                        </Box>
                    )}
                    
                    {!rating && !review && (
                        <Typography variant="body2" color="text.secondary">
                            No review yet. Click "Edit" to add your thoughts!
                        </Typography>
                    )}
                    
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                </Box>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                <DialogTitle>Delete Review</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete your review? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        variant="contained"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ReviewForm;