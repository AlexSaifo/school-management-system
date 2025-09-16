'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import { Box, CircularProgress } from '@mui/material';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for authentication state or stored token
    const storedToken = localStorage.getItem('auth_token');
    
    if (!loading && (user || storedToken)) {
      console.log('HomePage: User authenticated or token found, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  // Show login form only if user is not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
}
