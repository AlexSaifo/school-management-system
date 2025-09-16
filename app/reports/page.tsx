'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function ReportsPage() {
  return (
    <SidebarLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body1">
          Generate and view school reports and analytics here.
        </Typography>
      </Box>
    </SidebarLayout>
  );
}
