import React from 'react';
import { Box, Typography } from '@mui/material';
import StudentProgressionManager from '@/components/StudentProgressionManager';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function StudentProgressionPage() {
  return (
    <SidebarLayout>
      <Box>
        <StudentProgressionManager />
      </Box>
    </SidebarLayout>
  );
}