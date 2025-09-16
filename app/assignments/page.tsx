'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import { Box, Typography, Alert } from '@mui/material';

export default function AssignmentsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect('/');
  }

  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return (
      <SidebarLayout>
        <TeacherDashboard />
      </SidebarLayout>
    );
  }

  if (user.role === 'STUDENT') {
    return (
      <SidebarLayout>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Assignments
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Assignment submission and tracking functionality is being developed.
          </Alert>
          {/* StudentDashboard assignment view would go here */}
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Alert severity="warning">
        You don't have permission to access this page.
      </Alert>
    </SidebarLayout>
  );
}
