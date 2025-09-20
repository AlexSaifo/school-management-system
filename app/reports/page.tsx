'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Container,
  Paper,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import StudentReports from '@/components/reports/StudentReports';
import ClassReports from '@/components/reports/ClassReports';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderReportContent = () => {
    switch (activeTab) {
      case 0:
        return <StudentReports />;
      case 1:
        return <ClassReports />;
      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Teacher Reports
            </Typography>
            <Typography variant="body1">
              Teacher performance and student progress reports will be available here.
            </Typography>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Administrative Reports
            </Typography>
            <Typography variant="body1">
              School-wide statistics and administrative reports will be available here.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const getAvailableTabs = () => {
    const tabs = [
      { label: 'My Reports', value: 0 },
      { label: 'Class Reports', value: 1 },
    ];

    if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
      tabs.push({ label: 'Teacher Reports', value: 2 });
    }

    if (user?.role === 'ADMIN') {
      tabs.push({ label: 'Admin Reports', value: 3 });
    }

    return tabs;
  };

  return (
    <SidebarLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            View detailed reports and analytics for students, classes, and school performance.
          </Typography>

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {getAvailableTabs().map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>

            <Box sx={{ p: 0 }}>
              {renderReportContent()}
            </Box>
          </Paper>

          {/* Quick Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Attendance
                  </Typography>
                  <Typography variant="h4">
                    95.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Performance
                  </Typography>
                  <Typography variant="h4">
                    87.5%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Grade
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Students
                  </Typography>
                  <Typography variant="h4">
                    1,247
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Enrolled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Classes
                  </Typography>
                  <Typography variant="h4">
                    42
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Classes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </SidebarLayout>
  );
}
