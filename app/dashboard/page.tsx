'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import SidebarLayout from '@/components/layout/SidebarLayout';
import DashboardHome from '@/components/dashboard/DashboardHome';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import SimpleDashboard from '@/components/dashboard/SimpleDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('Dashboard: Current state - loading:', loading, 'user:', user);

  useEffect(() => {
    console.log('Dashboard: useEffect triggered - loading:', loading, 'user:', user);
    if (!loading && !user) {
      console.log('Dashboard: No user found, redirecting to login');
      router.push('/');
    }
  }, [user, loading, router]);

  console.log('Dashboard: About to render, loading:', loading, 'user:', !!user);

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
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const renderDashboard = () => {
    console.log('Dashboard: renderDashboard called with user role:', user?.role);
    switch (user.role) {
      case 'ADMIN':
        console.log('Dashboard: Rendering AdminDashboard');
        return <AdminDashboard />;
      case 'TEACHER':
        console.log('Dashboard: Rendering TeacherDashboard');
        return <TeacherDashboard />;
      case 'STUDENT':
        console.log('Dashboard: Rendering StudentDashboard');
        return <StudentDashboard />;
      case 'PARENT':
        console.log('Dashboard: Rendering ParentDashboard');
        return <ParentDashboard />;
      default:
        console.log('Dashboard: Rendering default DashboardHome, role:', user?.role);
        return <DashboardHome />;
    }
  };

  console.log('Dashboard: Rendering dashboard with user:', user?.email, 'role:', user?.role);
  
  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%', height: '100vh' }}>
        <SidebarLayout>
          {renderDashboard()}
        </SidebarLayout>
      </Box>
    </ErrorBoundary>
  );
}
