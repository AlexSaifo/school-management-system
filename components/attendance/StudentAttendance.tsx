'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function StudentAttendance() {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('attendance.admin.studentDescription', 'My Attendance')}
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            {t('attendance.admin.studentAccessMessage', 'Students cannot access attendance management. Please contact your teacher or parent for attendance information.')}
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
