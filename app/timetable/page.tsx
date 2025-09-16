'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import SidebarLayout from '@/components/layout/SidebarLayout';
import TimetableManager from '@/components/TimetableManager';
import StudentTimetable from '@/components/StudentTimetable';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TimetablePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading timetable...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SidebarLayout>
        <Box>
          {user.role === 'STUDENT' ? (
            <StudentTimetable />
          ) : (
            <TimetableManager />
          )}
        </Box>
      </SidebarLayout>
    </ErrorBoundary>
  );
}
