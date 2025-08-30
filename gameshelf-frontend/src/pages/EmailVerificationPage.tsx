import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Alert, Card, CardContent,
  CircularProgress, Fade
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Email as EmailIcon 
} from '@mui/icons-material';
import { verifyEmail } from '../services/api';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ username?: string; userId?: number }>({});

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        setUserInfo(response.data.data || {});
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
      }
    };

    verify();
  }, [token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center',
                py: 4
              }}
            >
              <EmailIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="h1" fontWeight={600}>
                Email Verification
              </Typography>
            </Box>

            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {status === 'verifying' && (
                <Box>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Verifying your email...
                  </Typography>
                  <Typography color="text.secondary">
                    Please wait while we verify your account.
                  </Typography>
                </Box>
              )}

              {status === 'success' && (
                <Box>
                  <CheckCircleIcon 
                    sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
                  />
                  <Typography variant="h5" gutterBottom color="success.main" fontWeight={600}>
                    Email Verified!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
                    {message}
                  </Typography>
                  {userInfo.username && (
                    <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                      Welcome to GameShelf, {userInfo.username}! Your account is now active.
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGoToLogin}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem'
                    }}
                  >
                    Go to Login
                  </Button>
                </Box>
              )}

              {status === 'error' && (
                <Box>
                  <ErrorIcon 
                    sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
                  />
                  <Typography variant="h5" gutterBottom color="error.main" fontWeight={600}>
                    Verification Failed
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
                    {message}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      component={Link}
                      to="/resend-verification"
                      variant="outlined"
                      size="large"
                    >
                      Resend Verification
                    </Button>
                    <Button
                      component={Link}
                      to="/register"
                      variant="contained"
                      size="large"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      Back to Register
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default EmailVerificationPage;