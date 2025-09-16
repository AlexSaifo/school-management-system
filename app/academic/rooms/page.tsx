'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function RoomsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new classrooms page
    router.replace('/academic/classrooms');
  }, [router]);

  return (
    <SidebarLayout>
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1">
          Redirecting to Classroom Management...
        </Typography>
      </Box>
    </SidebarLayout>
  );
}
