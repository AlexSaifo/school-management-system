'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Alert } from '@mui/material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import TeacherAttendance from '@/components/attendance/TeacherAttendance';
import ParentAttendance from '@/components/attendance/ParentAttendance';
import StudentAttendance from '@/components/attendance/StudentAttendance';
import AdminAttendance from '@/components/attendance/AdminAttendance';
import { useTranslation } from 'react-i18next';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  console.log(`TabPanel ${index} rendering, current tab value: ${value}, should show: ${value === index}`);

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `attendance-tab-${index}`,
    'aria-controls': `attendance-tabpanel-${index}`,
  };
}

export default function AttendancePage() {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Always get fresh user role from API to ensure accuracy
    const getUserRole = async () => {
      try {
        console.log('Fetching fresh user role from API...');

        // Check if we have auth token in cookies
        const cookies = document.cookie;
        console.log('Current cookies:', cookies);

        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include cookies in the request
        });
        console.log('API response status:', response.status);
        console.log('API response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const userData = await response.json();
          console.log('API response data:', userData);
          console.log('Setting userRole to:', userData.role);

          setUserRole(userData.role);
          localStorage.setItem('userRole', userData.role);
        } else {
          const errorText = await response.text();
          console.log('API error response:', errorText);

          // If /api/auth/me fails, try /api/auth/profile as fallback
          console.log('Trying /api/auth/profile as fallback...');
          const profileResponse = await fetch('/api/auth/profile', {
            credentials: 'include',
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile fallback successful:', profileData.user.role);
            setUserRole(profileData.user.role);
            localStorage.setItem('userRole', profileData.user.role);
          } else {
            console.log('Profile fallback also failed, trying localStorage fallback');
            // If both APIs fail, try localStorage as final fallback
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
              console.log('Using localStorage fallback:', storedRole);
              setUserRole(storedRole);
            } else {
              // If everything fails, redirect to login
              console.log('No valid session found, redirecting to login');
              window.location.href = '/auth/login';
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        console.log('Full error details:', error);

        // On error, try profile API as fallback
        console.log('Trying /api/auth/profile as error fallback...');
        try {
          const profileResponse = await fetch('/api/auth/profile', {
            credentials: 'include',
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile error fallback successful:', profileData.user.role);
            setUserRole(profileData.user.role);
            localStorage.setItem('userRole', profileData.user.role);
          } else {
            // If profile also fails, try localStorage
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
              console.log('Using localStorage fallback after error:', storedRole);
              setUserRole(storedRole);
            } else {
              // If everything fails, redirect to login
              window.location.href = '/auth/login';
              return;
            }
          }
        } catch (profileError) {
          console.error('Profile fallback also failed:', profileError);
          // Final fallback to localStorage
          const storedRole = localStorage.getItem('userRole');
          if (storedRole) {
            console.log('Using localStorage as final fallback:', storedRole);
            setUserRole(storedRole);
          } else {
            window.location.href = '/auth/login';
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderContent = () => {
    // Debug logging
    console.log('Current userRole:', userRole, 'Type:', typeof userRole);

    // Explicit check for ADMIN only
    if (userRole === 'ADMIN') {
      console.log('Rendering ADMIN view with tabs');
      return (
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="attendance tabs">
              <Tab label={t('attendance.admin.overview')} {...a11yProps(0)} />
              <Tab label={t('attendance.admin.teacherView')} {...a11yProps(1)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <AdminAttendance />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <TeacherAttendance />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <ParentAttendance />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <StudentAttendance />
          </TabPanel>
        </Box>
      );
    }

    // For all non-admin roles, show specific page without tabs
    console.log('Rendering non-admin view without tabs for role:', userRole);

    switch (userRole) {
      case 'TEACHER':
        return (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
              {t('attendance.admin.teacherDescription')}
            </Typography>
            <TeacherAttendance />
          </Box>
        );
      case 'PARENT':
        return (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
              {t('attendance.admin.parentDescription')}
            </Typography>
            <ParentAttendance />
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="h6" color="text.secondary">
              {t('attendance.admin.error')}
            </Typography>
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('attendance.admin.pageTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('attendance.admin.loading')}
          </Typography>
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('attendance.admin.pageTitle')}
        </Typography>

        {/* Only show tabs-related state for ADMIN users */}
        {userRole === 'ADMIN' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('attendance.admin.adminDescription')}
            </Typography>
          </Box>
        )}

        {renderContent()}
      </Box>
    </SidebarLayout>
  );
}
