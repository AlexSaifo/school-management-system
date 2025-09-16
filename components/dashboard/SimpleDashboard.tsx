'use client';

import { Box, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

export default function SimpleDashboard() {
  const { user, loading } = useAuth();

  console.log('SimpleDashboard: Rendering with user:', user, 'loading:', loading);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No user found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Typography variant="h4" gutterBottom>
        Simple Dashboard Test
      </Typography>
      <Typography variant="body1">
        Welcome, {user.firstName} {user.lastName}!
      </Typography>
      <Typography variant="body2">
        Email: {user.email}
      </Typography>
      <Typography variant="body2">
        Role: {user.role}
      </Typography>
      <Typography variant="body2">
        ID: {user.id}
      </Typography>
    </Box>
  );
}
