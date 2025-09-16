'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People,
  CheckCircle,
  Cancel,
  Schedule,
  EventBusy,
  TrendingUp,
  CalendarToday,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface GradeAttendance {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  classrooms: ClassroomAttendance[];
}

interface ClassroomAttendance {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  roomNumber: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

interface OverallStats {
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  overallAttendanceRate: number;
}

export default function AdminAttendance() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [attendanceData, setAttendanceData] = useState<{
    date: string;
    overallStats: OverallStats;
    grades: GradeAttendance[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAttendanceData = async (date: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/attendance/summary?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      setAttendanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAttendanceData(selectedDate.format('YYYY-MM-DD'));
    }
  }, [token, selectedDate]);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 75) return 'warning';
    return 'error';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'absent':
        return <Cancel color="error" />;
      case 'late':
        return <Schedule color="warning" />;
      case 'excused':
        return <EventBusy color="info" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          {t('attendance.admin.title', 'Attendance Overview')}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t('attendance.selectDate', 'Select Date')}
            value={selectedDate}
            onChange={(newValue) => newValue && setSelectedDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </LocalizationProvider>
      </Box>

      {attendanceData && (
        <>
          {/* Overall Statistics Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        {t('attendance.admin.totalStudents')}
                      </Typography>
                      <Typography variant="h4">
                        {attendanceData.overallStats.totalStudents}
                      </Typography>
                    </Box>
                    <People color="primary" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        {t('attendance.present')}
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {attendanceData.overallStats.totalPresent}
                      </Typography>
                    </Box>
                    <CheckCircle color="success" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        {t('attendance.absent')}
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {attendanceData.overallStats.totalAbsent}
                      </Typography>
                    </Box>
                    <Cancel color="error" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        {t('attendance.attendanceRate')}
                      </Typography>
                      <Typography variant="h4" color={
                        attendanceData.overallStats.overallAttendanceRate >= 90 ? 'success.main' :
                        attendanceData.overallStats.overallAttendanceRate >= 75 ? 'warning.main' : 'error.main'
                      }>
                        {attendanceData.overallStats.overallAttendanceRate}%
                      </Typography>
                    </Box>
                    <TrendingUp color={
                      attendanceData.overallStats.overallAttendanceRate >= 90 ? 'success' :
                      attendanceData.overallStats.overallAttendanceRate >= 75 ? 'warning' : 'error'
                    } fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Grade-wise Attendance */}
          <Typography variant="h5" fontWeight="bold" mb={2}>
            {t('attendance.admin.byGrade')}
          </Typography>

          {attendanceData.grades.map((grade) => (
            <Card key={grade.id} sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    {grade.name} ({t('attendance.admin.level')} {grade.level})
                  </Typography>
                  <Chip
                    label={`${grade.attendanceRate}%`}
                    color={getAttendanceColor(grade.attendanceRate)}
                    variant="outlined"
                  />
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('attendance.admin.classroom')}</TableCell>
                        <TableCell>{t('attendance.admin.room')}</TableCell>
                        <TableCell align="center">{t('attendance.admin.total')}</TableCell>
                        <TableCell align="center">{t('attendance.present')}</TableCell>
                        <TableCell align="center">{t('attendance.absent')}</TableCell>
                        <TableCell align="center">{t('attendance.late')}</TableCell>
                        <TableCell align="center">{t('attendance.excused')}</TableCell>
                        <TableCell align="center">{t('attendance.admin.rate')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grade.classrooms.map((classroom) => (
                        <TableRow key={classroom.id}>
                          <TableCell>
                            {classroom.name} - {classroom.section}
                          </TableCell>
                          <TableCell>{classroom.roomNumber}</TableCell>
                          <TableCell align="center">{classroom.totalStudents}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center">
                              <Typography color="success.main" fontWeight="bold">
                                {classroom.presentCount}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center">
                              <Typography color="error.main" fontWeight="bold">
                                {classroom.absentCount}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center">
                              <Typography color="warning.main" fontWeight="bold">
                                {classroom.lateCount}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center">
                              <Typography color="info.main" fontWeight="bold">
                                {classroom.excusedCount}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${classroom.attendanceRate}%`}
                              size="small"
                              color={getAttendanceColor(classroom.attendanceRate)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}

          {attendanceData.grades.length === 0 && (
            <Alert severity="info">
              {t('attendance.admin.noData')}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}