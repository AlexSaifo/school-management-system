'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function ExamsPage() {
  return (
    <SidebarLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Exams & Grades
        </Typography>
        <Typography variant="body1">
          Manage examinations and student grades here.
        </Typography>
      </Box>
    </SidebarLayout>
  );
}
