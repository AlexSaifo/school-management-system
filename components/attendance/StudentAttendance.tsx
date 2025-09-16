'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';

export default function StudentAttendance() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Attendance
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            Students cannot access attendance management. Please contact your teacher or parent for attendance information.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
